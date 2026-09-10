<p align="center">
  <img src="www/assets/logo.png" alt="RefinAir Logo" width="320">
</p>

# RefinAir Mobile 📱

> **Atmospheric & Indoor Environmental Intelligence Mobile Application**  
> Companion mobile client for Android, iOS, and Mobile Web (PWA).

---

## 🌟 Features

- **Real-Time AQI & Gas Telemetry**: Instant live readings for PM2.5, PM10, PM1.0, Temperature, Humidity, $CO_2$, and Satellite AOD 550nm.
- **AirVisual Pro Benchmark**: Displays calibrated correlation ratio ($0.985\times$) against scientific reference equipment.
- **24-Hour AI Predictive Trajectory**: Interactive SVG forecast graph with peak pollutant warnings and diurnal pattern assimilation.
- **Interactive ML What-If Simulator**: Adjust AOD, Wind Speed, and Rain sliders to instantly evaluate multi-model ensemble predictions.
- **Classroom BC6007 IAQ**: Front vs. Rear wall sensor thermal & $CO_2$ stratification monitor and ventilation advisories based on ANSYS Fluent CFD research.
- **National Divisions Overview**: Live AQI cards across all 8 administrative divisions of Bangladesh.
- **Offline Simulation Mode**: Realistic synthetic data generator built-in so the app works seamlessly even without an active server connection.
- **Mobile Push & Vibration Alerts**: Notifies when AQI $> 150$ (Unhealthy) or classroom $CO_2 > 1000\text{ ppm}$.

---

## 🚀 Quick Start (Running on Mobile)

### Option 1: Instant Mobile Web / PWA (Zero Install)

1. Make sure your desktop RefinAir server is running:
   ```bash
   python RefinAir_System/app.py
   # Or run the RefinAir.exe executable
   ```
2. Find your PC's local Wi-Fi IP address (e.g. `192.168.1.15`).
   - On Windows: Run `ipconfig` in CMD/PowerShell and look for `IPv4 Address`.
3. Open your mobile browser (Chrome / Safari) on your phone connected to the same Wi-Fi and navigate to:
   ```text
   http://<YOUR_PC_IP>:5000
   ```
4. **Install to Home Screen**:
   - **Android Chrome**: Tap the 3 dots $\rightarrow$ **Install app** or **Add to Home screen**.
   - **iOS Safari**: Tap the Share icon $\rightarrow$ **Add to Home Screen**.

---

### Option 2: Standalone Mobile Web Preview

Preview the mobile client locally:

```bash
cd RefinAir_Mobile
npx serve www -l 3000
```
Open `http://localhost:3000` in mobile emulation mode in your browser.

---

### Option 3: Building a Native Android APK (`.apk`)

The mobile app is pre-configured with **Capacitor**:

1. Install dependencies:
   ```bash
   cd RefinAir_Mobile
   npm install
   ```

2. Add the Android platform:
   ```bash
   npx cap add android
   ```

3. Sync web assets:
   ```bash
   npx cap sync
   ```

4. Open in Android Studio:
   ```bash
   npx cap open android
   ```

5. In Android Studio:
   - Click **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
   - Transfer the generated `.apk` to your phone and install.

---

## ⚙️ Connecting Phone to Your PC Server

1. In the mobile app, tap the **Settings** tab (gear icon).
2. Enter your PC's local network URL, for example:
   ```text
   http://192.168.1.50:5000
   ```
3. Tap **Test Ping** to verify connectivity.
4. Tap **Save & Connect**.
5. If you are away from your PC, simply toggle **Offline Simulation Mode** to test all features with simulated sensor data.

---

## 📁 Project Structure

```text
RefinAir_Mobile/
├── capacitor.config.json    # Capacitor native project configuration
├── package.json             # NPM dependencies & build scripts
├── README.md                # Mobile documentation
└── www/                     # Web assets (compiled into native app)
    ├── index.html           # Native mobile app layout & viewports
    ├── style.css            # Dark mode, iOS/Android safe area, glassmorphism
    ├── app.js               # Polling, offline fallback, SVG chart, alerts
    ├── manifest.json        # PWA manifest
    ├── sw.js                # Service worker caching
    └── assets/
        └── logo.png         # High-resolution app icon
```

---

## 🎓 Research & Collaboration

- **Independent University, Bangladesh (IUB)**
- **University of Leeds (UK)**
- **Coventry University (UK)**
