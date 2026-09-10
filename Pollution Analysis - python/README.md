# Pollution Analysis - python

This folder contains notebooks and scripts used to analyze PM2.5 and aerosol datasets.

Quick steps to run the analysis (Windows / PowerShell):

1. Create and activate a virtual environment:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install dependencies from the provided `requirements.txt`:

```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

3. Start JupyterLab and open `air_pollution.ipynb`:

```powershell
jupyter lab
```

Notes and troubleshooting:
- `cartopy` and `geopandas` often require system libraries (GEOS, PROJ). On Windows, consider using the `conda` distribution (Miniconda/Anaconda) for easier installation:

```powershell
conda create -n refinair python=3.10
conda activate refinair
conda install -c conda-forge geopandas cartopy netCDF4 xarray
pip install -r requirements.txt
```

- If notebooks reference relative data paths, run the preprocessing cells first (look for cells titled "Preprocessing" or filenames like `clean_*.py`).
- If you need pinned package versions, tell me and I will generate a pinned `requirements.txt` (with exact versions).

Files of interest:
- `air_pollution.ipynb` — main analysis notebook.
- `requirements.txt` — listed Python packages used by the analysis.
