// ===============================
// STEP 0: LOAD DATASETS
// ===============================
var wb = ee.FeatureCollection("projects/spheric-mesh-330606-487806/assets/wb_cln");
var fpv = ee.FeatureCollection("projects/spheric-mesh-330606-487806/assets/fpv_cln");

// ===============================
// STEP 1: MAP SETUP
// ===============================
Map.setOptions('SATELLITE');
Map.centerObject(fpv, 5);

var fpvLayer = ui.Map.Layer(
  fpv.style({
    color: 'yellow',
    fillColor: '00000000',
    width: 1
  }),
  {},
  'FPV Polygons'
);
Map.layers().add(fpvLayer);

// ===============================
// STEP 2: UI PANEL
// ===============================
var panel = ui.Panel({
  style: {
    width: '380px',
    padding: '8px'
  }
});
ui.root.insert(0, panel);

panel.add(ui.Label({
  value: 'FPV Info Panel',
  style: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
  }
}));

panel.add(ui.Label('Select Year:'));
var yearSelect = ui.Select({
  items: ['2019', '2020', '2021', '2022', '2023', '2024'],
  value: '2022',
  style: {stretch: 'horizontal'}
});
panel.add(yearSelect);

panel.add(ui.Label('Select Month:'));
var monthSelect = ui.Select({
  items: ['01','02','03','04','05','06','07','08','09','10','11','12'],
  value: '07',
  style: {stretch: 'horizontal'}
});
panel.add(monthSelect);

panel.add(ui.Label({
  value: 'Click an FPV polygon once, then change month/year and press Update Layer.',
  style: {margin: '8px 0'}
}));

var info = ui.Panel();
var chartPanel = ui.Panel();

panel.add(info);
panel.add(chartPanel);

// ===============================
// STEP 3: GLOBAL STATE
// ===============================
var currentWBLayer = null;
var currentNDCILayer = null;
var currentChlLayer = null;
var selectedFeature = null;

// ===============================
// STEP 4: HELPER - GET MONTHLY IMAGE
// ===============================
function getMonthlyComposite(linkedWB, year, monthNum) {
  var startDate = ee.Date.fromYMD(ee.Number.parse(year), monthNum, 1);
  var endDate = startDate.advance(1, 'month');

  var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(linkedWB.geometry())
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 40)); // relaxed from 20

  return {
    collection: s2,
    image: s2.median()
  };
}

// ===============================
// STEP 5: HELPER - MONTHLY CHL IMAGE
// ===============================
function getMonthlyChlImage(linkedWB, year, monthNum) {
  var compositeObj = getMonthlyComposite(linkedWB, year, monthNum);
  var s2 = compositeObj.collection;
  var img = compositeObj.image;
  var count = s2.size();

  var hasData = count.gt(0);

  var ndci = ee.Image(
    ee.Algorithms.If(
      hasData,
      img.normalizedDifference(['B5', 'B4']).rename('NDCI').clip(linkedWB),
      ee.Image.constant(-999).rename('NDCI').clip(linkedWB)
    )
  );

  var chl = ee.Image(
    ee.Algorithms.If(
      hasData,
      ndci.expression(
        '14.039 + 86.115 * ndci + 194.325 * ndci * ndci',
        {ndci: ndci}
      ).rename('Chlorophyll_a'),
      ee.Image.constant(-999).rename('Chlorophyll_a').clip(linkedWB)
    )
  );

  return {
    ndci: ndci,
    chl: chl,
    count: count,
    hasData: hasData
  };
}

// ===============================
// STEP 6: TIME-SERIES CHART
// ===============================
function buildTimeSeriesChart(linkedWB, year) {
  chartPanel.clear();

  chartPanel.add(ui.Label({
    value: 'Monthly Chlorophyll-a Trend (' + year + ')',
    style: {fontWeight: 'bold', margin: '10px 0 6px 0'}
  }));

  var months = ee.List.sequence(1, 12);

  // Build a server-side list of monthly mean chlorophyll values
  var monthlyMeans = months.map(function(m) {
    m = ee.Number(m);

    var result = getMonthlyChlImage(linkedWB, year, m);
    var chl = result.chl;
    var hasData = result.hasData;

    var meanChl = ee.Algorithms.If(
      hasData,
      ee.Number(
        chl.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: linkedWB.geometry(),
          scale: 20,
          maxPixels: 1e9
        }).get('Chlorophyll_a')
      ),
      null
    );

    return meanChl;
  });

  // Convert to client side and build chart safely
  monthlyMeans.evaluate(function(values) {
    if (!values) {
      chartPanel.add(ui.Label('Could not generate chart.'));
      return;
    }

    // Replace nulls with NaN so the line can break gracefully
    var cleanValues = values.map(function(v) {
      return v === null ? NaN : v;
    });

    var chart = ui.Chart.array.values({
      array: cleanValues,
      axis: 0,
      xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    })
    .setChartType('LineChart')
    .setOptions({
      title: 'Mean Chlorophyll-a by Month',
      hAxis: {title: 'Month'},
      vAxis: {title: 'Mean Chlorophyll-a'},
      lineWidth: 2,
      pointSize: 4,
      legend: {position: 'none'}
    });

    chartPanel.add(chart);
  });
}

// ===============================
// STEP 7: UPDATE ANALYSIS
// ===============================
function updateAnalysis() {
  if (selectedFeature === null) {
    info.clear();
    info.add(ui.Label('No FPV selected yet. Click an FPV polygon first.'));
    chartPanel.clear();
    return;
  }

  var selectedYear = yearSelect.getValue();
  var selectedMonth = ee.Number.parse(monthSelect.getValue());

  var wb_lookup = ee.String(selectedFeature.get('wb_ids'));
  var linkedWB = wb.filter(ee.Filter.eq('id', wb_lookup));

  if (currentWBLayer !== null) {
    Map.remove(currentWBLayer);
    currentWBLayer = null;
  }
  if (currentNDCILayer !== null) {
    Map.remove(currentNDCILayer);
    currentNDCILayer = null;
  }
  if (currentChlLayer !== null) {
    Map.remove(currentChlLayer);
    currentChlLayer = null;
  }

  currentWBLayer = ui.Map.Layer(
    linkedWB.style({
      color: '00FFFF',
      fillColor: '00FFFF88',
      width: 3
    }),
    {},
    'Linked Waterbody'
  );
  Map.layers().add(currentWBLayer);
  Map.centerObject(linkedWB, 11);

  var result = getMonthlyChlImage(linkedWB, selectedYear, selectedMonth);
  var ndci = result.ndci;
  var chl = result.chl;
  var count = result.count;
  var hasData = result.hasData;

  var ndciVis = {
    min: -0.05,
    max: 0.15,
    palette: ['blue', 'green', 'yellow', 'red']
  };

  var chlVis = {
    min: 0,
    max: 50,
    palette: ['blue', 'cyan', 'green', 'yellow', 'orange', 'red']
  };

  // Only add layers if month has data
  hasData.evaluate(function(ok) {
    if (ok) {
      currentNDCILayer = ui.Map.Layer(ndci, ndciVis, 'NDCI');
      currentChlLayer = ui.Map.Layer(chl, chlVis, 'Chlorophyll-a');

      Map.layers().add(currentNDCILayer);
      Map.layers().add(currentChlLayer);
    } else {
      info.add(ui.Label('No Sentinel-2 images found for this month after filtering. Try another month.'));
    }
  });

  buildTimeSeriesChart(linkedWB, selectedYear);

  print('Updated year-month:', selectedYear + '-' + monthSelect.getValue());
  print('Selected wb_ids:', wb_lookup);
  print('Image count for selected month:', count);

  print('NDCI stats:', ee.Algorithms.If(
    hasData,
    ndci.reduceRegion({
      reducer: ee.Reducer.minMax(),
      geometry: linkedWB.geometry(),
      scale: 20,
      maxPixels: 1e9
    }),
    ee.Dictionary({message: 'No data for selected month'})
  ));

  print('Chlorophyll-a stats:', ee.Algorithms.If(
    hasData,
    chl.reduceRegion({
      reducer: ee.Reducer.minMax(),
      geometry: linkedWB.geometry(),
      scale: 20,
      maxPixels: 1e9
    }),
    ee.Dictionary({message: 'No data for selected month'})
  ));
}

// ===============================
// STEP 8: UPDATE BUTTON
// ===============================
var updateButton = ui.Button({
  label: 'Update Layer',
  onClick: updateAnalysis,
  style: {stretch: 'horizontal'}
});
panel.add(updateButton);

// ===============================
// STEP 9: CLICK FUNCTION
// ===============================
Map.onClick(function(coords) {
  var point = ee.Geometry.Point([coords.lon, coords.lat]);
  var selected = fpv.filterBounds(point).first();

  selected.evaluate(function(feature) {
    info.clear();

    if (!feature) {
      info.add(ui.Label('No FPV polygon clicked.'));
      chartPanel.clear();
      return;
    }

    var props = feature.properties;

    for (var key in props) {
      info.add(ui.Label(key + ': ' + props[key]));
    }

    info.add(ui.Label('Selected period: ' + yearSelect.getValue() + '-' + monthSelect.getValue()));

    selectedFeature = ee.Feature(selected);
    updateAnalysis();
  });
});