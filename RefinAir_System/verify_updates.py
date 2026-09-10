import urllib.request
import json
import sys

def test_endpoints():
    print("--- 1. Testing GET / ---")
    req = urllib.request.urlopen("http://127.0.0.1:5000/")
    assert req.status == 200
    html = req.read().decode('utf-8')
    print("[OK] Main page returned 200 OK")

    # Assertions on HTML
    assert "demo" not in html.lower(), "ERROR: 'demo' found in HTML!"
    print("[OK] No 'demo' keyword found in HTML")

    assert "BC6007" not in html.split('id="activeDeviceSelect"')[1].split('</select>')[0], "ERROR: BC6007 found in device dropdown!"
    print("[OK] Room BC6007 NOT mentioned for Node IUB-01 in device dropdown")

    assert "Barometric Pressure" not in html, "ERROR: Barometric Pressure still found in HTML!"
    print("[OK] Barometric Pressure card successfully removed")

    assert "aqi-spectrum-legend" in html, "ERROR: aqi-spectrum-legend not found!"
    assert "Good" in html and "Moderate" in html and "Unhealthy" in html and "Hazardous" in html
    print("[OK] AQI spectrum legend with explicit category states present")

    assert "cad-whiteboard-assembly" in html, "ERROR: cad-whiteboard-assembly not found!"
    assert "cad-wb-sensor" in html, "ERROR: cad-wb-sensor not found!"
    assert "Sensor D-2" in html, "ERROR: Sensor D-2 not found!"
    print("[OK] Whiteboard assembly with top sensor D-2 present")

    assert "cadSplitAc1" in html and "cadSplitAc2" in html, "ERROR: Two AC units not found!"
    assert "AC-1" in html and "AC-2" in html
    print("[OK] Two ACs side by side (AC-1 and AC-2) present on North wall")

    assert "ansysSliceCanvas" in html, "ERROR: ansysSliceCanvas not found!"
    assert "cfd3DTitle" in html and "ansysGradientRamp" in html
    print("[OK] ANSYS Fluent 3D Slice canvas and dynamic legend elements present")

    print("\n--- 2. Testing GET /api/telemetry/live?device=iub_campus ---")
    res = urllib.request.urlopen("http://127.0.0.1:5000/api/telemetry/live?device=iub_campus")
    assert res.status == 200
    data = json.loads(res.read().decode('utf-8'))
    dev = data['device']
    print(f"Device name: {dev['name']}")
    print(f"Device location: {dev['location']}")
    assert "BC6007" not in dev['location'], "ERROR: BC6007 in device location!"
    assert "BC6007" not in dev['name'], "ERROR: BC6007 in device name!"
    print("[OK] Telemetry API device metadata verified (no BC6007 for IUB-01)")

    print("\n--- 3. Testing GET /api/classroom/spatial_nodes ---")
    res2 = urllib.request.urlopen("http://127.0.0.1:5000/api/classroom/spatial_nodes")
    assert res2.status == 200
    cdata = json.loads(res2.read().decode('utf-8'))['data']
    nodes = cdata['nodes']
    node2 = next(n for n in nodes if n['deviceId'] == 2)
    print(f"Node 2: {node2['name']} at {node2['location']}")
    assert "Whiteboard" in node2['name']
    print("[OK] Node 2 configured on top of whiteboard")

    print("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_endpoints()
