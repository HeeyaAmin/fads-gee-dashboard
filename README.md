# 🌍 FPV Water Quality Dashboard (Google Earth Engine)

This project is an interactive geospatial dashboard built using Google Earth Engine to explore floating photovoltaic (FPV) systems and their potential environmental impact on water bodies.

The tool combines real-world FPV datasets with satellite imagery (Sentinel-2) to estimate chlorophyll-a levels — a key indicator of water quality and algal activity — and visualize how these change over time.

---

## 🔗 Live Demo
https://spheric-mesh-330606-487806.projects.earthengine.app/view/fpvfinalversion

---

## 📌 What this project does

The dashboard allows users to:

- View FPV installations on a global map  
- Click on any FPV site to inspect its details  
- Automatically link the FPV to its corresponding waterbody  
- Analyze water quality using satellite-derived chlorophyll-a  
- Explore changes across different months and years  
- View trends through a time-series chart  
- See summary statistics for better interpretation  

The goal is to make environmental analysis of floating solar systems more intuitive and interactive.

---

## 🛰️ Data used

- FPV dataset (floating solar installations)  
- Waterbody dataset (linked using IDs)  
- Sentinel-2 Surface Reflectance imagery (Google Earth Engine)  

---

## ⚙️ How it works (in simple terms)

1. When you click on an FPV polygon, the app finds the associated waterbody  
2. It pulls satellite images for that location and time period  
3. It computes the **Normalized Difference Chlorophyll Index (NDCI)**  
4. This is converted into **chlorophyll-a concentration** using a polynomial formula  
5. The results are shown as:
   - a color-coded map layer  
   - a monthly trend chart  
   - summary statistics  

---

## 📊 Features

- Interactive map with FPV selection  
- Linked waterbody visualization  
- Month and year filters  
- Chlorophyll-a heatmap  
- Time-series chart (monthly trends)  
- Summary stats:
  - monthly mean chlorophyll-a  
  - number of satellite images used  
  - annual average chlorophyll-a  
- Clean UI with legend and status updates  

---

## 🛠️ Tech stack

- Google Earth Engine (GEE)  
- JavaScript (GEE UI API)  
- Sentinel-2 satellite imagery  
- Geospatial FeatureCollections  

---

## 👩‍🔬 Research Team

**Professor**  
Rafael M. Almeida  

**Postdoctoral Associate**  
Aline de Matos Valerio  

**Team Members**  
Heeya Mineshkumar Amin  
Freny Reji  
Sakshi Nair  

---

## 🚀 How to use

1. Open the live demo link  
2. Click on any FPV polygon on the map  
3. Select a year and month  
4. Click **Update Analysis**  
5. Explore:
   - chlorophyll-a map  
   - trend chart  
   - summary statistics  

---

## 💡 Why this project matters

Floating solar is growing rapidly, but its environmental impact is still being studied.

This dashboard helps:
- visualize those impacts  
- make satellite data accessible  
- support research and decision-making  

---

## 🔮 Future improvements

- smoother UI interactions (loading indicators, transitions)  
- multi-year comparisons  
- additional water quality indicators  
- predictive modeling using ML  
- better mobile responsiveness  

---

## 📄 Note

This project was developed as part of a research initiative focused on environmental monitoring using geospatial analytics and remote sensing.

---