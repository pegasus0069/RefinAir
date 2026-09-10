"""
RefinAir: Atmospheric & Indoor Environmental Intelligence System
Web Server & High-Performance REST API
"""

import os
import io
import csv
import math
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify, request, Response, send_from_directory
from data_streamer import streamer
from ml_engine import ml_engine
from cfd_streamer import cfd_streamer

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["JSON_SORT_KEYS"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.jinja_env.auto_reload = True

# Workspace root path for referencing original diagrams and datasets
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/telemetry/live")
def api_live_telemetry():
    """
    Returns real-time streaming telemetry with active clock timestamps,
    environmental readings, AQI, AirVisual Pro comparison, and Classroom IAQ
    for the selected monitoring node (Default: Deployed at IUB).
    """
    device_id = request.args.get("device", "iub_campus")
    data = streamer.get_current_reading(device_id=device_id)
    return jsonify(data)

@app.route("/api/telemetry/history")
def api_telemetry_history():
    """
    Returns historical telemetry points leading up to the current timestamp
    for live line charts and time-series visualization for the selected node (Default: 5 Hours).
    """
    device_id = request.args.get("device", "iub_campus")
    points = request.args.get("points", default=30, type=int)
    hours = request.args.get("hours", default=5.0, type=float)
    history = streamer.get_recent_history(hours=hours, points=min(120, max(10, points)), device_id=device_id)
    return jsonify({
        "status": "success",
        "device_id": device_id,
        "hours": hours,
        "count": len(history),
        "history": history,
        "data": history
    })

@app.route("/api/export/nodes")
def api_export_nodes():
    """
    Returns the full catalog of all exportable monitoring stations and spatial nodes.
    """
    return jsonify({
        "status": "success",
        "nodes": streamer.get_all_exportable_nodes()
    })

@app.route("/api/export/csv")
def api_export_csv():
    """
    Exports authenticated environmental observation streams in standard RFC 4180 CSV format
    for any single node or batch of selected nodes.
    """
    nodes_param = request.args.get("nodes", "iub_campus")
    node_ids = [n.strip() for n in nodes_param.split(",") if n.strip()]
    time_range = request.args.get("range", "5h")

    records = streamer.get_export_records(node_ids=node_ids, time_range=time_range)

    output = io.StringIO()
    writer = csv.writer(output)

    # Standard header columns
    headers = [
        "Timestamp",
        "Node_ID",
        "Node_Name",
        "Location_Class",
        "PM1_ug_m3",
        "PM25_ug_m3",
        "PM10_ug_m3",
        "Temperature_C",
        "Relative_Humidity_pct",
        "CO2_ppm",
        "CO_ppm",
        "NO2_ppm",
        "VOC_ppm",
        "AOD_550nm",
        "AQI",
        "AQI_Category"
    ]
    writer.writerow(headers)

    for r in records:
        writer.writerow([
            r["Timestamp"],
            r["Node_ID"],
            r["Node_Name"],
            r["Location_Class"],
            r["PM1_ug_m3"],
            r["PM25_ug_m3"],
            r["PM10_ug_m3"],
            r["Temperature_C"],
            r["Relative_Humidity_pct"],
            r["CO2_ppm"],
            r["CO_ppm"],
            r["NO2_ppm"],
            r["VOC_ppm"],
            r["AOD_550nm"],
            r["AQI"],
            r["AQI_Category"]
        ])

    csv_content = output.getvalue()
    output.close()

    time_slug = datetime.now().strftime("%Y%m%d_%H%M%S")
    if len(node_ids) == 1:
        fname = f"RefinAir_{node_ids[0]}_{time_range}_{time_slug}.csv"
    else:
        fname = f"RefinAir_MultiNode_{len(node_ids)}Nodes_{time_range}_{time_slug}.csv"

    return Response(
        csv_content,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"}
    )

@app.route("/api/telemetry/devices")
def api_telemetry_devices():
    """
    Returns metadata for all available deployed monitoring nodes
    including the primary IUB campus installation.
    """
    return jsonify({
        "status": "success",
        "devices": streamer.get_devices_list()
    })

@app.route("/api/map/divisions")
def api_map_divisions():
    """
    Returns all 8 Bangladesh administrative divisions with live AQI and meteorology.
    """
    divisions = streamer.get_division_stations()
    return jsonify({"status": "success", "stations": divisions})

@app.route("/api/map/industrial")
def api_map_industrial():
    """
    Returns high-priority industrial corridors and thermal power generation zones.
    """
    zones = streamer.get_industrial_zones()
    return jsonify({"status": "success", "zones": zones})

@app.route("/api/map/transit")
def api_map_transit():
    """
    Returns live mobile IoT transit nodes (highway vehicle fleets & marine vessels).
    """
    transit = streamer.get_transit_nodes()
    return jsonify({"status": "success", "nodes": transit})

@app.route("/api/predict", methods=["GET", "POST"])
def api_predict():
    """
    Inference endpoint: evaluates inputs against Multiple Linear Regression (MLR),
    XGBoost, Random Forest, and Gradient Boosting Regressor models.
    """
    if request.method == "POST":
        payload = request.get_json(silent=True) or request.form.to_dict()
    else:
        payload = request.args.to_dict()

    # If parameters not provided, default to current live reading values
    cur = streamer.get_current_reading()["telemetry"]
    inputs = {
        "aod_550": float(payload.get("aod_550", cur["aod_550"])),
        "temperature": float(payload.get("temperature", cur["temperature"])),
        "rain_precipitation": float(payload.get("rain_precipitation", cur["rain_precipitation"])),
        "wind_speed": float(payload.get("wind_speed", cur["wind_speed"])),
        "visibility": float(payload.get("visibility", cur["visibility"])),
        "cloud_cover": float(payload.get("cloud_cover", cur["cloud_cover"])),
        "relative_humidity": float(payload.get("relative_humidity", cur["humidity"]))
    }

    result = ml_engine.predict_all(inputs)
    return jsonify(result)

@app.route("/api/ml/forecast24h")
def api_ml_forecast24h():
    """
    Generates a 24-hour predictive trajectory of surface PM2.5 concentrations
    assimilating NASA satellite AOD observations, surface meteorological variables,
    and planetary boundary layer dynamics.
    """
    cur = streamer.get_current_reading()["telemetry"]
    inputs = {
        "aod_550": cur["aod_550"],
        "temperature": cur["temperature"],
        "rain_precipitation": cur["rain_precipitation"],
        "wind_speed": cur["wind_speed"],
        "visibility": cur["visibility"],
        "cloud_cover": cur["cloud_cover"],
        "relative_humidity": cur["humidity"]
    }
    base_res = ml_engine.predict_all(inputs)
    base_pm = base_res["ensemble_mean"]
    now = datetime.now()
    hourly_forecast = []

    # 24-hour diurnal profile based on boundary-layer height and urban rush hours
    for h in range(24):
        target_time = now + timedelta(hours=h)
        hour_of_day = target_time.hour
        # Diurnal factor: peak in morning (7-9 AM) and night (20-23 PM) due to inversion
        if 6 <= hour_of_day <= 9:
            diurnal = 1.16 + 0.04 * math.sin((hour_of_day - 6) / 3 * math.pi)
        elif 12 <= hour_of_day <= 16:
            diurnal = 0.84 - 0.03 * math.sin((hour_of_day - 12) / 4 * math.pi)
        elif 19 <= hour_of_day <= 23:
            diurnal = 1.20 + 0.05 * math.sin((hour_of_day - 19) / 4 * math.pi)
        else:
            diurnal = 1.04

        predicted_val = round(max(15.0, base_pm * diurnal + 1.2 * math.sin(h / 3.0)), 1)
        ci_low = round(max(5.0, predicted_val * 0.93), 1)
        ci_high = round(predicted_val * 1.07, 1)

        hourly_forecast.append({
            "hour_label": target_time.strftime("%H:00"),
            "time_display": target_time.strftime("%b %d, %H:00"),
            "timestamp": target_time.isoformat(),
            "pm25": predicted_val,
            "ci_low": ci_low,
            "ci_high": ci_high
        })

    return jsonify({
        "status": "success",
        "current_prediction": base_res,
        "meteorological_drivers": {
            "aod_550": cur["aod_550"],
            "visibility": cur["visibility"],
            "relative_humidity": cur["humidity"],
            "wind_speed": cur["wind_speed"],
            "temperature": cur["temperature"]
        },
        "hourly_forecast": hourly_forecast
    })

@app.route("/api/ml/metrics")
def api_ml_metrics():
    """
    Returns evaluation metrics (R2, RMSE, MAE, Accuracy), feature importances,
    and observed vs predicted parity points for all models.
    """
    return jsonify({
        "status": "success",
        "metrics": ml_engine.metrics,
        "feature_importance": ml_engine.feature_importance,
        "parity_data": ml_engine.parity_data
    })

@app.route("/api/classroom/cfd")
def api_classroom_cfd():
    """
    Returns Computational Fluid Dynamics (CFD) simulation data, boundary conditions,
    and slice contours for Room BC6007 at Independent University, Bangladesh (IUB).
    """
    cur_live = streamer.get_current_reading()["classroom_bc6007"]
    return jsonify({
        "status": "success",
        "classroom_metadata": {
            "room_id": "BC6007",
            "institution": "Independent University, Bangladesh (IUB)",
            "collaborators": ["University of Leeds (UK)", "Coventry University (UK)"],
            "dimensions_m": {"length": 12.395, "width": 7.010, "height": 3.048},
            "volume_m3": 264.8,
            "air_conditioning": "2x 10.3 kW Split AC Units (Non-Ducted, Recirculating)",
            "sensors": [
                {"id": "Sensor_Front", "location": "Front wall", "relative_height": "+0.34m higher", "coordinates": [1.2, 0.4, 2.2]},
                {"id": "Sensor_Back", "location": "Rear wall", "relative_height": "Standard height", "distance_apart_m": 7.0, "coordinates": [11.1, 0.9, 1.86]}
            ]
        },
        "simulation_parameters": {
            "solver": "ANSYS Fluent 2022 R2",
            "turbulence_model": "Reynolds-Averaged Navier-Stokes (RANS) k-omega SST",
            "inlet_velocity_mps": 2.4,
            "inlet_temperature_c": 19.5,
            "heat_sources": "35 occupants (75W sensible heat each) + lighting (12 W/m2)"
        },
        "live_metrics": cur_live,
        "spatial_data": cfd_streamer.get_live_spatial_nodes(),
        "cfd_contours": {
            "velocity_slices": [
                {"slice": "Mid-Plane Y=3.5m", "max_velocity_mps": 2.4, "min_velocity_mps": 0.05, "desc": "Strong recirculating jet under split AC; low velocity in student breathing zone"},
                {"slice": "Breathing Plane Z=1.1m", "max_velocity_mps": 0.42, "min_velocity_mps": 0.02, "desc": "Gentle draft across desks"}
            ],
            "temperature_slices": [
                {"slice": "Vertical Slices", "front_wall_temp_c": 24.2, "back_wall_temp_c": 20.4, "stratification_delta": 3.8, "desc": "Clear thermal stratification observed, warm air rising toward ceiling"}
            ],
            "co2_mass_fraction_slices": [
                {"slice": "Breathing Zone", "peak_co2_ppm": 1280, "background_co2_ppm": 415, "desc": "Exhaled plumes accumulate near center/rear due to sealed door and lack of outdoor fresh air supply"}
            ]
        }
    })

@app.route("/api/classroom/spatial_nodes")
def api_classroom_spatial_nodes():
    """
    Returns real-time 10-node spatial telemetry from CFD_new_data dataset
    for continuous 2D inverse distance weighting (IDW) heat map rendering.
    """
    data = cfd_streamer.get_live_spatial_nodes()
    return jsonify({"status": "success", "data": data})

if __name__ == "__main__":
    print("=" * 70)
    print("RefinAir: Atmospheric & Indoor Environmental Intelligence System")
    print("Independent University, Bangladesh (IUB) Collaborative Research Platform")
    print("Live Server running at: http://127.0.0.1:5000")
    print("=" * 70)
    app.run(host="0.0.0.0", port=5000, debug=False)
