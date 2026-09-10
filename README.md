<p align="center">
  <img src="logo.png" alt="RefinAir: Your Air, Our Care!" width="380">
</p>

# RefinAir: Atmospheric & Indoor Environmental Intelligence System

[![GitHub Release](https://img.shields.io/github/v/release/pegasus0069/RefinAir?color=brightgreen&label=Release)](https://github.com/pegasus0069/RefinAir/releases/tag/v1.0.0)
[![Platforms: Windows | Linux | Docker](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20Docker-blue.svg)](https://github.com/pegasus0069/RefinAir/releases)
[![Python: 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Git LFS](https://img.shields.io/badge/Git%20LFS-Enabled-orange.svg)](https://git-lfs.github.com/)

> **Independent University, Bangladesh (IUB)**  
> **School of Engineering, Technology and Sciences • Department of Computer Science & Engineering**  
> **Undergraduate Thesis & Research Project Monograph**  
> *Author: Noor-E Sadman Arnoy (Student ID: 1730008) • Supervisor: Dr. Mahady Hasan*

---

## Table of Contents
1. [Abstract & Research Scope](#abstract--research-scope)
2. [Quick Launch Matrix](#quick-launch-matrix)
3. [Key System Modules](#key-system-modules)
   - [RefinAir Web Platform & Digital Twin](#1-refinair-web-platform--digital-twin)
   - [RefinAir Mobile App (Android / iOS / PWA)](#2-refinair-mobile-app-android--ios--pwa)
   - [Classroom BC6007 3D Spatial IAQ](#3-classroom-bc6007-3d-spatial-iaq--cfd-modeling)
   - [Satellite AOD Machine Learning Pipeline](#4-satellite-aod-machine-learning-pipeline)
   - [Hardware IoT Sensor Architecture](#5-hardware-iot-sensor-architecture)
4. [Machine Learning Performance & Evaluation](#machine-learning-performance--evaluation)
5. [Hardware Validation & Cost Benchmarking](#hardware-validation--cost-benchmarking)
6. [Repository Structure](#repository-structure)
7. [Research Documents & Monographs](#research-documents--monographs)
8. [Citation (BibTeX)](#citation-bibtex)
9. [License & Credits](#license--credits)

---

## Abstract & Research Scope

Dhaka, Bangladesh routinely ranks among the world's most atmospheric-polluted megacities, characterized by hazardous winter fine particulate matter ($\text{PM}_{2.5}$) concentrations exceeding WHO guidelines by over tenfold. Concurrently, modern educational and commercial spaces rely on sealed, non-ducted split-type air conditioners that recirculate stale indoor air without fresh ventilation, causing carbon dioxide accumulation, thermal stratification, and airborne pathogen persistence.

**RefinAir** provides an end-to-end environmental intelligence architecture:
1. **Low-Cost IoT Ground Nodes**: Custom-designed microcontroller hardware (Arduino Mega 2560 + ESP8266) integrating laser scattering particulate monitors, optical CO2 sensors, and electrochemical gas probes.
2. **Satellite Remote Sensing & Machine Learning**: Ground $\text{PM}_{2.5}$ prediction from NASA Aqua MODIS satellite Aerosol Optical Depth (AOD at 550nm) combined with ground meteorological covariates across 5 benchmark regression algorithms.
3. **Classroom BC6007 3D Digital Twin**: Microclimate spatial interpolation (Inverse Distance Weighting) across 10 simultaneous indoor observation nodes validated with Computational Fluid Dynamics (CFD).
4. **Interactive Production Web Dashboard**: Standalone zero-installation application offering live telemetry streaming, GIS national surveillance, and authenticated RFC 4180 CSV export.

---

## Quick Launch Matrix

| Operating System | Method | Command / Action | Requirements |
| :--- | :--- | :--- | :--- |
| **Windows 10 / 11** | **1-Click Standalone** | Double-click [`RefinAir_System/RefinAir.exe`](RefinAir_System/RefinAir.exe) | **Zero install**. Bundles Python, Waitress, ML engines, and datasets. |
| **Linux (All Distros)** | **Autonomous Runner** | `cd RefinAir_System && chmod +x run_linux.sh && ./run_linux.sh` | Standard system Python 3 (automatically provisions isolated runtime). |
| **Universal (Docker)** | **Containerized** | `cd RefinAir_System && docker compose up` | Docker & Docker Compose. |
| **Developer Source** | **Python Virtualenv** | `pip install -r RefinAir_System/requirements.txt && python RefinAir_System/app.py` | Python 3.8+. |

*Dashboard launches automatically at `http://127.0.0.1:5000`.*

---

## Key System Modules

### 1. RefinAir Web Platform & Digital Twin
Located in [`RefinAir_System/`](RefinAir_System/):
- High-performance REST API built with Flask and multi-threaded Waitress WSGI server.
- Dynamic telemetry streaming engine synchronizing current time clocks with historical datasets.
- Interactive GIS surveillance map covering all 8 administrative divisions of Bangladesh and 5 major industrial corridors with asynchronous non-blocking Copernicus CAMS live feeds.
- Data export center supporting selective node batching and temporal windows (5h, 24h, 7d, Full History).

### 2. RefinAir Mobile App (Android / iOS / PWA)
Located in [`RefinAir_Mobile/`](RefinAir_Mobile/):
- **Native Touch UI & Design**: Built with luxury dark mode glassmorphism, animated circular AQI gauge, and haptic feedback.
- **Real-Time Atmospheric Telemetry**: Low-latency polling of ground sensors, AirVisual Pro calibration ($0.985\times$), and national divisions overview.
- **24h Predictive ML & What-If Simulator**: Interactive parameter adjustment (AOD, Wind, Precipitation) with real-time multi-model ensemble inference.
- **Offline Simulation Mode**: Autonomous mock sensor engine allowing offline field demonstrations anywhere.
- **Multi-Platform Deployment**: Direct mobile web preview (`/mobile`), 1-tap Progressive Web App (PWA) installation to home screen, and Capacitor configuration for compiling to native Android APK (`.apk`) and iOS packages.

### 3. Classroom BC6007 3D Spatial IAQ & CFD Modeling
- Real 10-node spatial IoT observation matrix from Classroom BC6007 at Independent University, Bangladesh (Dimensions: $12.395\,\text{m} \times 7.010\,\text{m} \times 3.048\,\text{m}$, Volume: $264.8\,\text{m}^3$).
- Inverse Distance Weighting (IDW) 2D/3D heat-map interpolation across breathing zones ($Z = 1.1\,\text{m}$) and split-AC recirculation zones ($Z = 2.4\,\text{m}$).
- Real-time infection risk index calculations based on exhaled plume accumulation and air exchange rates.

### 4. Satellite AOD Machine Learning Pipeline
Located in [`Pollution Analysis - python/`](Pollution%20Analysis%20-%20python/) and [`RefinAir_System/ml_engine.py`](RefinAir_System/ml_engine.py):
- Daily Aerosol Optical Depth (AOD 550nm) extracted from NASA Aqua MODIS satellite (`MYD08_D3_6_1_Deep_Blue_Aerosol_Optical_Depth_550_Land_Mean`).
- Spatiotemporal feature engineering combining ground temperature, relative humidity, wind speed, precipitation, cloud cover, visibility, day-of-week, and calendar month.
- 5 comparative models: Multiple Linear Regression (MLR), Random Forest, Gradient Boosting, XGBoost, and Artificial Neural Networks (ANN).

### 5. Hardware IoT Sensor Architecture
Located in [`Arduino_Code/`](Arduino_Code/) and [`Arduino Mega Wifi/`](Arduino%20Mega%20Wifi/):
- **Core Microcontroller**: Arduino Mega 2560 + ESP8266 WiFi SoC module.
- **Particulate Sensing**: Plantower PMS5003 laser scattering particle counter ($\text{PM}_1$, $\text{PM}_{2.5}$, $\text{PM}_{10}$).
- **Gas & IAQ Probes**: Winsen MH-Z19B / MQ-135 (CO2, CO, NO2, VOCs).
- **Meteorological Sensors**: DHT22 / AM2302 (Temperature & Relative Humidity, $\pm 0.5^\circ\text{C}$, $\pm 2\%\,\text{RH}$).
- **Chronometry & Storage**: DS3231 high-precision I2C RTC with micro-SD card local datalogging.

---

## Machine Learning Performance & Evaluation

Models were evaluated on independent testing partitions using standard metrics:

$$\text{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^n (y_i - \hat{y}_i)^2}, \quad R^2 = 1 - \frac{\sum_{i=1}^n (y_i - \hat{y}_i)^2}{\sum_{i=1}^n (y_i - \bar{y})^2}, \quad \text{MAE} = \frac{1}{n}\sum_{i=1}^n |y_i - \hat{y}_i|$$

| Algorithm | Coefficient of Determination ($R^2$) | Root Mean Squared Error (RMSE) | Mean Absolute Error (MAE) | Training Time (s) |
| :--- | :---: | :---: | :---: | :---: |
| **XGBoost Regressor** | **0.871** | **22.84 $\mu\text{g}/\text{m}^3$** | **17.15 $\mu\text{g}/\text{m}^3$** | 0.42 |
| **Random Forest Regressor** | 0.849 | 24.71 $\mu\text{g}/\text{m}^3$ | 18.62 $\mu\text{g}/\text{m}^3$ | 0.38 |
| **Gradient Boosting Regressor** | 0.812 | 27.56 $\mu\text{g}/\text{m}^3$ | 20.45 $\mu\text{g}/\text{m}^3$ | 0.29 |
| **Artificial Neural Network (ANN)** | 0.768 | 30.62 $\mu\text{g}/\text{m}^3$ | 23.80 $\mu\text{g}/\text{m}^3$ | 1.15 |
| **Multiple Linear Regression (MLR)** | 0.694 | 35.19 $\mu\text{g}/\text{m}^3$ | 27.42 $\mu\text{g}/\text{m}^3$ | 0.05 |

*XGBoost demonstrated superior generalization by capturing non-linear interactions between satellite aerosol optical depth and relative humidity during monsoon-to-winter seasonal transitions.*

---

## Hardware Validation & Cost Benchmarking

RefinAir was collocated and benchmarked alongside an industrial-grade **IQAir AirVisual Pro** monitoring station deployed at Independent University, Bangladesh (IUB):

| Metric | RefinAir Ground Node | IQAir AirVisual Pro | Delta / Benefit |
| :--- | :---: | :---: | :---: |
| **Measured Mean $\text{PM}_{2.5}$** | $22.9\,\mu\text{g}/\text{m}^3$ | $23.2\,\mu\text{g}/\text{m}^3$ | $\Delta = 0.3\,\mu\text{g}/\text{m}^3$ ($1.31\%$ relative error) |
| **Correlation ($R^2$)** | **0.984** | 1.000 | Excellent sensor fidelity |
| **BOM Production Cost** | **16,150 BDT** (~$145 USD) | **35,500 BDT** (~$320 USD) | **54.5% Cost Reduction** |
| **Connectivity & Storage** | WiFi (ESP8266) + MicroSD + REST API | Proprietary Cloud | Open REST API & RFC 4180 CSV Export |

---

## Repository Structure

```text
RefinAir/
├── RefinAir_System/                         # Core Web Application & Standalone Production System
│   ├── RefinAir.exe                         # Windows 1-click standalone executable (181 MB)
│   ├── run_windows.bat                      # Windows launcher batch script
│   ├── run_linux.sh                         # Linux zero-config autonomous launcher script
│   ├── Dockerfile                           # Production container specification
│   ├── docker-compose.yml                   # Docker Compose service definition
│   ├── requirements.txt                     # Pinned cross-platform dependencies
│   ├── app.py                               # Flask application entry point & REST API
│   ├── data_streamer.py                     # Streaming engine & Copernicus GIS synchronization
│   ├── cfd_streamer.py                      # 10-node spatial IAQ & IDW interpolation engine
│   ├── ml_engine.py                         # 5-algorithm ML inference & training engine
│   ├── cfd_aggregated.parquet               # High-frequency CFD spatial IAQ dataset (4.3 MB)
│   ├── data/                                # Complete bundled research datasets
│   ├── static/                              # CSS styles, JS controllers, manifest.json, sw.js
│   └── templates/                           # index.html dashboard and poster.html views
├── RefinAir_Mobile/                         # Standalone Mobile Application (Android / iOS / PWA)
│   ├── capacitor.config.json                # Native mobile compilation settings
│   ├── package.json                         # Node dependencies & Capacitor build scripts
│   ├── README.md                            # Mobile app guide & Android APK export steps
│   └── www/                                 # Mobile-first web assets
│       ├── index.html                       # Native mobile viewport & 5-tab interface
│       ├── style.css                        # Glassmorphic dark theme & safe-area insets
│       ├── app.js                           # Telemetry engine, offline fallback & ML sim
│       ├── manifest.json                    # Web App Manifest
│       └── sw.js                            # Offline caching service worker
├── PM2.5 Data/                              # Historical ground-based PM2.5 datasets (2017–2021)
├── IQAIR Data/                              # Monthly AirVisual Pro reference observation dumps
├── Arduino_Code/                            # Main Arduino Mega 2560 firmware sketch (.ino)
├── Arduino Mega Wifi/                       # ESP8266 flashing tools, AT firmware, and libraries
├── BD_Data_Scrapping/                       # Automated web scrapers for regional meteorological data
├── Diagrams/                                # System BPMN, hardware schematics, and Visio diagrams
├── Overleaf/                                # LaTeX thesis source code and vector figures
├── Pollution Analysis - python/             # Exploratory analysis and machine learning notebooks
├── Python Datalogger/                       # Serial-to-cloud telemetry ingest daemon
├── CFD_new_data.csv                         # Raw 10-node spatial IAQ dataset (Tracked with Git LFS)
├── Noor_E_Sadman_Classroom_IAQ_Project_Report_IUB.pdf   # Official Classroom IAQ Project Report
├── Cloud Driven IoT based Big Data Solution...pdf       # Full Undergraduate Thesis Monograph
└── LICENSE                                  # MIT Open-Source License
```

---

## Research Documents & Monographs

1. **Undergraduate Thesis Monograph**:
   - [`Cloud Driven IoT based Big Data Solution_ Air Quality Monitoring System and Predictive Analysis of Satellite Data using Machine Learning.pdf`](Cloud%20Driven%20IoT%20based%20Big%20Data%20Solution_%20Air%20Quality%20Monitoring%20System%20and%20Predictive%20Analysis%20of%20Satellite%20Data%20using%20Machine%20Learning.pdf)  
   *Comprehensive documentation of system architecture, hardware schematics, sensor physics, NASA satellite AOD integration, and comparative machine learning results for Dhaka.*

2. **Classroom IAQ Special Research Report**:
   - [`Noor_E_Sadman_Classroom_IAQ_Project_Report_IUB.pdf`](Noor_E_Sadman_Classroom_IAQ_Project_Report_IUB.pdf)  
   *Investigates spatial $\text{PM}_{2.5}$, $\text{CO}_2$, and thermal stratification in Classroom BC6007 under split-AC operational regimes.*

3. **Academic Research Poster**:
   - [`RefinAir_System/RefinAir Poster.pdf`](RefinAir_System/RefinAir%20Poster.pdf) and interactive HTML view at [`RefinAir_System/refinair_academic_poster.html`](RefinAir_System/refinair_academic_poster.html).

---

## Citation (BibTeX)

If utilizing the RefinAir platform, datasets, firmware, or predictive models in academic publications, please cite:

```bibtex
@thesis{arnoy2021refinair,
  author       = {Noor-E Sadman Arnoy},
  title        = {Cloud Driven IoT based Big Data Solution: Air Quality Monitoring System and Predictive Analysis of Satellite Data using Machine Learning},
  school       = {Independent University, Bangladesh (IUB)},
  year         = {2021},
  type         = {Bachelor's Thesis},
  address      = {Dhaka, Bangladesh},
  supervisor   = {Dr. Mahady Hasan},
  url          = {https://github.com/pegasus0069/RefinAir}
}
```

---

## License & Credits

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file for details.

Developed at the **Department of Computer Science & Engineering**, **Independent University, Bangladesh (IUB)**.  
For research inquiries, collaborations, or deployment inquiries, please open an issue or contact the authors.
