# RefinAir

**RefinAir — Air quality data, analysis and IoT tools for Dhaka**

This repository collects datasets, analysis scripts, Arduino/ESP firmware and diagrams used for PM2.5 and aerosol analysis, monitoring prototypes, and documentation produced during the RefinAir project.

**Purpose**: provide cleaned datasets, reproducible Python analysis and visualization code, and Arduino/ESP examples for local air-quality logging and uploads.

**Repository Structure**
- **`PM2.5 Data/`**: Time-series PM2.5 CSVs (2017–2021) used for analysis and plotting.
- **`IQAIR Data/`**: Raw AirVisual/IQAir data dumps (monthly text files).
- **`Arduino_Code/`**: Main Arduino sketch(s). See `Arduino_Code/Arduino_Code.ino`.
- **`Arduino Mega Wifi/`**: Firmware, libraries and flashing tools for ESP8266/ESP modules and Mega Wifi builds.
- **`Pollution Analysis - python/`**: Python scripts, notebooks and helper modules used to generate figures and perform modeling.
- **`Python Datalogger/`**: Data ingestion and datalogger scripts (serial/HTTP upload helpers).
- **`Diagrams/`**: BPMN, maps, schematics and other Visio diagrams used in reports.
- **`Overleaf/`**: LaTeX source (paper/thesis) and bibliography.
- **Top-level CSV files**: important single-file datasets (e.g. `climate_historical_data_2017-2021Jun.csv`, `dhaka-us consulate-air-quality.csv`, satellite AOD files `g4.areaAvgTimeSeries...csv`).
- **`LICENSE`**: repository license.

**Quick Start (Windows / PowerShell)**
- **Requirements**: `Python 3.8+`, `pip`, optionally `virtualenv` or `venv`, and the `Arduino IDE` (or PlatformIO) for microcontroller code.
- **Recommended Python packages**: `pandas`, `numpy`, `matplotlib`, `seaborn`, `scikit-learn`, `jupyterlab`. Create a `requirements.txt` in `Pollution Analysis - python/` if you want reproducible installs.

Create and activate a virtual environment (PowerShell):

```
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install pandas numpy matplotlib seaborn scikit-learn jupyterlab
```

Start JupyterLab (to open notebooks in `Pollution Analysis - python/`):

```
jupyter lab
```

**Running the analyses**
- Open notebooks or scripts in `Pollution Analysis - python/` and run cells top-to-bottom. Data files are referenced relative to the repository root in the `PM2.5 Data/` and top-level CSVs.
- If a script expects cleaned CSVs, run any included preprocessing (look for filenames like `clean_*.py` or notebook cells named "Preprocessing").

**Hardware / Arduino notes**
- Open `Arduino_Code/Arduino_Code.ino` in the Arduino IDE.
- Required libraries are included or referenced in `Arduino Mega Wifi/libraries/` — install these into your Arduino libraries folder if the IDE shows missing libraries.
- To flash ESP8266/ESP devices, you can use the provided flasher tools in `Arduino Mega Wifi/ESP8266_flasher_*` or use the Arduino IDE's built-in upload.

**Data descriptions (high level)**
- **`PM2.5 Data/`**: Ground-based PM2.5 measurements aggregated by year/month.
- **`dhaka-us consulate*.csv`**: US consulate monitoring station data (public reference station for Dhaka).
- **`climate_historical_data_2017-2021Jun.csv`**: Climate covariates used for correlation analysis.
- **`g4.areaAvgTimeSeries*.csv`**: MODIS / aerosol optical depth (AOD) region-average time series (satellite-derived aerosol proxy).

**Thesis & Research Paper**
- **`Cloud Driven IoT based Big Data Solution_ Air Quality Monitoring System and Predictive Analysis of Satellite Data using Machine Learning.pdf`**  
  Main thesis/research paper documenting the RefinAir project: system architecture, IoT hardware design, data collection methodology, machine learning models for PM2.5 prediction from satellite AOD and ground sensors, and results/evaluation for air quality monitoring in Dhaka, Bangladesh.

**Reproducibility tips**
- Keep data and code versions together: if you modify a dataset, save a new CSV with a clear suffix (e.g. `*_v2.csv`).
- Create a `requirements.txt` in `Pollution Analysis - python/` and pin package versions for reproducible environments.
- Add short README or usage notes inside subfolders that contain scripts (e.g. `Pollution Analysis - python/README.md`) to document how to run specific notebooks.

**Contributing**
- Fork, create a branch, make changes and open a pull request. Describe changes and data provenance in the PR.

**License & Credits**
- See the top-level `LICENSE` file for license details and reuse terms.

**Contact / Author**
- Repository maintained by the RefinAir project contributors. For questions or to collaborate, open an issue or contact the original author listed in the project files.

---
Small next steps I can do for you:
- Generate a `requirements.txt` with the packages used by the Python analysis.
- Add short READMEs inside `Pollution Analysis - python/` and `Arduino_Code/` showing exact run/flash commands.
If you'd like one of these, tell me which and I'll add it.
