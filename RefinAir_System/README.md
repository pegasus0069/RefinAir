# RefinAir: Atmospheric & Indoor Environmental Intelligence System

[![Platform: Windows | Linux | Docker](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20Docker-blue.svg)](https://github.com/pegasus0069/RefinAir/releases)
[![Python: 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)
[![Release: v1.0.0](https://img.shields.io/badge/release-v1.0.0-brightgreen.svg)](https://github.com/pegasus0069/RefinAir/releases/tag/v1.0.0)

> **Independent University, Bangladesh (IUB)**  
> **Collaborative Research Platform & Production Environmental Digital Twin**  
> *Author: Noor-E Sadman Arnoy (ID: 1730008) • Supervisor: Dr. Mahady Hasan*

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Key Capabilities](#key-capabilities)
3. [Quick Start & Execution](#quick-start--execution)
   - [Windows Standalone (.exe)](#1-windows-standalone-executable-zero-install)
   - [Linux Standalone Runner](#2-linux-autonomous-runner-zero-install)
   - [Universal Docker Container](#3-universal-docker-container)
   - [Python Development Server](#4-python-development-environment)
4. [System Architecture](#system-architecture)
5. [Core Software Modules](#core-software-modules)
6. [REST API Documentation](#rest-api-documentation)
7. [Embedded Datasets](#embedded-datasets)
8. [Standalone Build Guide](#standalone-build-guide)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

**RefinAir** is an integrated environmental intelligence platform that unites ground IoT sensor telemetry, NASA satellite observations (Aqua MODIS AOD), high-resolution Computational Fluid Dynamics (CFD) spatial modeling, and machine learning into an interactive, real-time dashboard.

Originally developed as a senior research project at Independent University, Bangladesh (IUB), the system addresses urban atmospheric particulate pollution in Dhaka and microclimate indoor air quality (IAQ) dynamics in sealed, split-AC educational environments.

---

## Key Capabilities

- **Real-Time Live Telemetry Engine**: Continuous streaming of PM1, PM2.5, PM10, Temperature, Relative Humidity, CO2, CO, NO2, VOCs, surface atmospheric pressure, wind speed, and AOD with active clock synchronization.
- **AirVisual Pro Hardware Validation**: Live side-by-side benchmarking against a co-located factory-calibrated IQAir AirVisual Pro station ($R^2 = 0.984$, relative error $< 1.5\%$, $54.5\%$ cost savings).
- **Classroom BC6007 3D Digital Twin**: High-frequency 10-node spatial IoT observations mapped to physical coordinates in Classroom BC6007 at IUB, rendered via 2D/3D Inverse Distance Weighting (IDW) interpolation heat maps and CFD contour slices.
- **Machine Learning Predictive Engine**: Ground PM2.5 forecasting from NASA Aqua MODIS Satellite AOD (550nm) and weather covariates across 5 benchmark algorithms: Multiple Linear Regression (MLR), Random Forest Regressor, Gradient Boosting, XGBoost, and Artificial Neural Networks (ANN).
- **GIS Surveillance Map**: National coverage monitoring all 8 administrative divisions of Bangladesh and 5 critical industrial energy corridors (Gazipur, Narayanganj, Savar/Ashulia, Chittagong EPZ, Ghorashal Power Complex).
- **Environmental Telemetry Data Export Center**: Standard RFC 4180 CSV export engine with single or batch node selection and multiple temporal observation windows (5 Hours, 24 Hours, 7 Days, Full History).

---

## Quick Start & Execution

RefinAir is pre-packaged for **zero-installation execution** across all major desktop operating systems.

### 1. Windows Standalone Executable (Zero Install)

The single executable file bundles the entire Python runtime, Waitress WSGI server, native C++ libraries, datasets, and web UI. No external dependencies or installations are required.

- **Option A**: Double-click [`RefinAir.exe`](RefinAir.exe) directly inside this folder.
- **Option B**: Double-click [`run_windows.bat`](run_windows.bat).
- **Browser**: Automatically opens your default web browser to `http://127.0.0.1:5000`.

### 2. Linux Autonomous Runner (Zero Install)

On modern Linux distributions (Ubuntu, Debian, Fedora, Arch, Mint, RHEL), Python 3 is already pre-installed by default. The autonomous shell runner provisions an isolated runtime without touching system packages or requiring `sudo`.

```bash
cd RefinAir_System
chmod +x run_linux.sh
./run_linux.sh
```

*Note: If Wine is installed, you can also run the Windows executable directly on Linux via `./run_linux.sh --wine`.*

### 3. Universal Docker Container

Run with Docker and Docker Compose on any operating system without installing Python or libraries:

```bash
cd RefinAir_System
docker compose up -d
```
Access the dashboard at `http://localhost:5000`. To stop: `docker compose down`.

### 4. Python Development Environment

To run the Flask application directly from source:

```bash
# Create and activate virtual environment
python -m venv .venv
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Launch development server
python app.py
```

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           RefinAir Web Client                            │
│  Interactive Telemetry • 3D Digital Twin • ML Studio • GIS Map • Export  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP / REST APIs (JSON / CSV)
┌────────────────────────────────────▼─────────────────────────────────────┐
│                 Waitress WSGI / Flask Application Server                 │
│                                (app.py)                                  │
└──────────────┬─────────────────────┬─────────────────────┬───────────────┘
               │                     │                     │
┌──────────────▼──────┐┌─────────────▼───────┐┌───────────▼───────────────┐
│   cfd_streamer.py   ││   data_streamer.py  ││       ml_engine.py        │
│ 10-Node Spatial IAQ ││ Temporal Telemetry  ││ MLR • Random Forest • XGB │
│  IDW Interpolation  ││ Copernicus GIS Sync ││ Gradient Boosting • ANN   │
└──────────────┬──────┘└─────────────┬───────┘└───────────┬───────────────┘
               │                     │                     │
┌──────────────▼─────────────────────▼─────────────────────▼───────────────┐
│                        Embedded Datasets (data/)                         │
│ cfd_aggregated.parquet • Preprocessed Dataset.csv • Train/Test Partitions│
│     Copernicus CAMS Live Feeds • MODIS AOD 550nm Satellite Records       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Core Software Modules

| File | Primary Responsibility |
| :--- | :--- |
| [`app.py`](app.py) | Main application entry point, Flask REST API routing, cross-platform path resolution, automatic browser launch, and Waitress WSGI production server. |
| [`data_streamer.py`](data_streamer.py) | Generates dynamic real-time telemetry from historical MODIS/ground data, manages multi-node device registry, calculates US AQI breakpoints, handles RFC 4180 CSV export, and manages asynchronous Copernicus CAMS GIS synchronization. |
| [`cfd_streamer.py`](cfd_streamer.py) | Ingests the 10-node spatial dataset from `cfd_aggregated.parquet`, models 3D microclimate dynamics in Classroom BC6007, and computes 2D inverse distance weighting (IDW) interpolation matrices. |
| [`ml_engine.py`](ml_engine.py) | Trains and evaluates 5 machine learning models predicting ground PM2.5 from satellite AOD and meteorological features. Computes real-time evaluation metrics ($R^2$, RMSE, MAE) and provides on-demand prediction inference. |
| [`templates/index.html`](templates/index.html) | Single-page responsive web application interface featuring glassmorphic design, active telemetry meters, interactive Leaflet GIS maps, Three.js/Canvas digital twin rendering, and Chart.js analytics. |
| [`static/js/`](static/js/) | Modular JavaScript controllers: `app.js` (tab manager), `telemetry.js` (live clocks & metrics), `classroom_twin.js` (3D IDW twin), `ml_dashboard.js` (model performance), `map.js` (GIS observation), and `export_manager.js` (data export). |

---

## REST API Documentation

### 1. Live Telemetry
- **`GET /api/telemetry/live`**
  - **Query Parameters**: `device` (default: `"iub_campus"`)
  - **Description**: Returns live atmospheric readings with current timestamps, active clock synchronization, computed US AQI, AirVisual Pro side-by-side delta, and indoor classroom metrics.
  - **Example Response**:
    ```json
    {
      "timestamp": "2026-09-11 03:16:59",
      "station": "Deployed at IUB (Independent University, Bangladesh)",
      "telemetry": {
        "pm25": 22.9,
        "pm10": 35.1,
        "temperature": 23.2,
        "humidity": 93.5,
        "co2": 517,
        "aod_550": 0.9199
      },
      "aqi": { "aqi": 74, "category": "Moderate", "color": "#ffff00" },
      "airvisual_comparison": {
        "refinair_pm25": 22.9,
        "airvisual_pm25": 23.2,
        "delta_pm25": 0.3,
        "relative_error_pct": 1.31,
        "r2_correlation": 0.984
      }
    }
    ```

### 2. Telemetry Time Series
- **`GET /api/telemetry/history`**
  - **Query Parameters**: `device` (default: `"iub_campus"`), `hours` (float, default: `5.0`), `points` (int, default: `30`)
  - **Description**: Returns chronological telemetry history leading up to the current timestamp for interactive line charts.

### 3. Classroom 3D Digital Twin Spatial Nodes
- **`GET /api/classroom/spatial_nodes`**
  - **Description**: Returns real-time observations across all 10 physical sensor nodes deployed throughout Classroom BC6007 with $(x, y, z)$ spatial coordinates for continuous IDW heat-map interpolation.

### 4. Classroom CFD Summary
- **`GET /api/classroom/summary`**
  - **Description**: Returns high-level room metrics, front vs. rear sensor stratification deltas, infection risk index, and CFD velocity/temperature/CO2 slice profiles.

### 5. Machine Learning Benchmarks
- **`GET /api/ml/metrics`**
  - **Description**: Returns comparative evaluation metrics ($R^2$, RMSE, MAE) and paired observed-vs-predicted test evaluation points for all 5 machine learning models.

### 6. On-Demand ML Inference
- **`POST /api/ml/predict`**
  - **Content-Type**: `application/json`
  - **Body**:
    ```json
    {
      "aod_550": 0.85,
      "temperature": 28.5,
      "rain_precipitation": 0.0,
      "wind_speed": 4.2,
      "visibility": 8.0,
      "cloud_cover": 25.0,
      "relative_humidity": 65.0
    }
    ```
  - **Description**: Evaluates input parameters against all 5 models simultaneously and returns predicted PM2.5 concentrations and health category advisories.

### 7. GIS Map Surveillance Stations
- **`GET /api/map/stations`**
  - **Description**: Returns real-time atmospheric observations across all 8 administrative divisions of Bangladesh, 5 critical industrial zones, and mobile highway/river transit nodes. Non-blocking with asynchronous background synchronization.

### 8. Data Export Engine
- **`GET /api/export/nodes`**: Returns complete catalog of all exportable monitoring stations.
- **`GET /api/export/csv`**
  - **Query Parameters**: `nodes` (comma-separated node IDs, e.g. `"iub_campus,dhaka_central"`), `range` (`"5h"`, `"24h"`, `"7d"`, `"all"`)
  - **Response**: Authenticated RFC 4180 CSV file stream (`Content-Type: text/csv`).

---

## Embedded Datasets

All datasets required by the system are bundled inside [`data/`](data/) and embedded inside the standalone executable:

| Dataset File | Records / Format | Description |
| :--- | :--- | :--- |
| `cfd_aggregated.parquet` | 10 Nodes / Parquet (4.3 MB) | Time-aggregated CFD spatial observations across Classroom BC6007. |
| `Preprocessed Dataset.csv` | 1,450+ Daily Records / CSV | Synchronized NASA Aqua MODIS AOD (550nm) and ground meteorological observations (2017–2021). |
| `Train Dataset (Updated).csv` | 80% Partition / CSV | Cleaned training dataset for machine learning regression models. |
| `Test Dataset (Updated).csv` | 20% Partition / CSV | Independent testing partition for model validation. |
| `Dhaka_PM2.5_2017-2021_YTD.csv` | Annual Archives / CSV | Longitudinal PM2.5 ground measurements from Dhaka. |
| `climate_historical_data_2017-2021Jun.csv` | Multi-Year / CSV | Daily ground meteorological records (temperature, humidity, precipitation, wind). |
| `dhaka-us consulate-air-quality.csv` | Continuous / CSV | US Embassy / Consulate reference air-quality ground station records. |

---

## Standalone Build Guide

To rebuild the standalone Windows executable `RefinAir.exe`:

```powershell
# Ensure virtual environment has PyInstaller, Pillow, and Waitress
.\.venv\Scripts\pip install pyinstaller pillow waitress

# Execute PyInstaller build using spec configuration
.\.venv\Scripts\pyinstaller.exe --workpath "$env:TEMP\refinair_build" --distpath "dist" --clean RefinAir.spec

# Copy output executable into RefinAir_System
Copy-Item dist\RefinAir.exe RefinAir.exe -Force
```

---

## Troubleshooting

1. **Port 5000 Already in Use**:
   - If another service is occupying port 5000, stop the existing process or set `port = 5050` in `app.py`.
   - On Windows: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force`.
2. **Browser Does Not Launch Automatically**:
   - Manually open any modern web browser (Chrome, Edge, Firefox, Safari) and navigate to `http://127.0.0.1:5000`.
3. **Running in Headless Linux / Server Environments**:
   - When running on a remote cloud server or VPS, access via `http://<server-ip>:5000`. Ensure port 5000 is permitted in firewall rules (`ufw allow 5000/tcp`).

---

## License & Credits

RefinAir is licensed under the [MIT License](../LICENSE).  
Developed at the **Department of Computer Science & Engineering**, Independent University, Bangladesh (IUB).
