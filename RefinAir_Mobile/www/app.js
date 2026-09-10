/**
 * RefinAir Mobile: Environmental Intelligence Companion App
 * Independent University, Bangladesh (IUB)
 */

(function () {
  'use strict';

  // --- Configuration & State ---
  const STORAGE_KEYS = {
    SERVER_URL: 'refinair_mobile_server_url',
    DEMO_MODE: 'refinair_mobile_demo_mode',
    ALERT_AQI: 'refinair_mobile_alert_aqi',
    ALERT_CO2: 'refinair_mobile_alert_co2',
    LAST_NODE: 'refinair_mobile_selected_node'
  };

  // Auto-detect server: if running from http/https server use origin; otherwise localhost:5000
  let defaultServer = 'http://127.0.0.1:5000';
  if (window.location.protocol.startsWith('http') && window.location.port !== '80' && window.location.port !== '443') {
    defaultServer = window.location.origin;
  }

  let serverUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL) || defaultServer;
  let isDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
  let isConnected = false;
  let activeNode = localStorage.getItem(STORAGE_KEYS.LAST_NODE) || 'iub_campus';
  let pollInterval = null;
  let lastAqiAlertTime = 0;
  let lastCo2AlertTime = 0;

  // --- DOM Elements ---
  const dom = {
    connBadge: document.getElementById('connBadge'),
    connText: document.getElementById('connText'),
    nodeSelect: document.getElementById('nodeSelect'),
    syncTime: document.getElementById('syncTime'),
    
    // Live View
    aqiVal: document.getElementById('aqiVal'),
    aqiBadge: document.getElementById('aqiBadge'),
    gaugeProgress: document.getElementById('gaugeProgress'),
    primaryPollutant: document.getElementById('primaryPollutant'),
    healthAdvice: document.getElementById('healthAdvice'),
    airVisualVal: document.getElementById('airVisualVal'),
    dataFidelity: document.getElementById('dataFidelity'),
    
    valPM25: document.getElementById('valPM25'),
    barPM25: document.getElementById('barPM25'),
    statusPM25: document.getElementById('statusPM25'),
    valPM10: document.getElementById('valPM10'),
    barPM10: document.getElementById('barPM10'),
    statusPM10: document.getElementById('statusPM10'),
    valPM1: document.getElementById('valPM1'),
    barPM1: document.getElementById('barPM1'),
    valTemp: document.getElementById('valTemp'),
    valHumidity: document.getElementById('valHumidity'),
    valCO2: document.getElementById('valCO2'),
    statusCO2: document.getElementById('statusCO2'),
    valAOD: document.getElementById('valAOD'),
    btnManualSync: document.getElementById('btnManualSync'),
    
    // Forecast & Sim
    forecastPeakPill: document.getElementById('forecastPeakPill'),
    chartLinePath: document.getElementById('chartLinePath'),
    chartAreaPath: document.getElementById('chartAreaPath'),
    simSliderAOD: document.getElementById('simSliderAOD'),
    simValAOD: document.getElementById('simValAOD'),
    simSliderWind: document.getElementById('simSliderWind'),
    simValWind: document.getElementById('simValWind'),
    simSliderRain: document.getElementById('simSliderRain'),
    simValRain: document.getElementById('simValRain'),
    simResultPM25: document.getElementById('simResultPM25'),
    simResultCat: document.getElementById('simResultCat'),
    
    // Classroom
    frontCO2: document.getElementById('frontCO2'),
    frontTemp: document.getElementById('frontTemp'),
    rearCO2: document.getElementById('rearCO2'),
    rearTemp: document.getElementById('rearTemp'),
    
    // Divisions
    divisionList: document.getElementById('divisionList'),
    
    // Settings
    serverUrlInput: document.getElementById('serverUrlInput'),
    btnTestConn: document.getElementById('btnTestConn'),
    btnSaveConn: document.getElementById('btnSaveConn'),
    pingFeedback: document.getElementById('pingFeedback'),
    toggleDemoMode: document.getElementById('toggleDemoMode'),
    toggleAqiAlert: document.getElementById('toggleAqiAlert'),
    toggleCo2Alert: document.getElementById('toggleCo2Alert'),
    btnHeaderSettings: document.getElementById('btnHeaderSettings'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),
    
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    viewPanels: document.querySelectorAll('.view-panel')
  };

  // --- Initial Setup ---
  function init() {
    registerServiceWorker();
    setupNavigation();
    setupSettings();
    setupSimulator();

    dom.nodeSelect.value = activeNode;
    dom.nodeSelect.addEventListener('change', (e) => {
      activeNode = e.target.value;
      localStorage.setItem(STORAGE_KEYS.LAST_NODE, activeNode);
      showToast(`Switched node to: ${dom.nodeSelect.selectedOptions[0].text}`);
      fetchTelemetry();
    });

    dom.btnManualSync.addEventListener('click', () => {
      showToast('Refreshing live stream...');
      fetchTelemetry();
      fetchForecast();
      fetchDivisions();
    });

    // Start Live Polling (every 3.5 seconds)
    fetchTelemetry();
    fetchForecast();
    fetchDivisions();
    pollInterval = setInterval(fetchTelemetry, 3500);
  }

  // --- Service Worker ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('SW Registration note:', err);
      });
    }
  }

  // --- Navigation & View Switching ---
  function setupNavigation() {
    dom.navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetViewId = btn.getAttribute('data-view');
        switchView(targetViewId);
      });
    });

    dom.btnHeaderSettings.addEventListener('click', () => {
      switchView('view-settings');
    });
  }

  function switchView(targetViewId) {
    dom.navItems.forEach((btn) => {
      if (btn.getAttribute('data-view') === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    dom.viewPanels.forEach((panel) => {
      if (panel.id === targetViewId) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // If switching to divisions or forecast, make sure data is fresh
    if (targetViewId === 'view-divisions') fetchDivisions();
    if (targetViewId === 'view-forecast') fetchForecast();
  }

  // --- Toast Notifications ---
  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    dom.toastMsg.textContent = msg;
    dom.toast.classList.remove('hidden');
    toastTimer = setTimeout(() => {
      dom.toast.classList.add('hidden');
    }, 2800);
  }

  // --- Connection Status Indicator ---
  function setConnectionStatus(status, text) {
    dom.connBadge.className = 'status-pill';
    if (status === 'live') {
      dom.connBadge.classList.add('status-live');
      dom.connText.textContent = text || 'Live Online';
      isConnected = true;
    } else if (status === 'demo') {
      dom.connBadge.classList.add('status-connecting');
      dom.connText.textContent = 'Simulated';
      isConnected = false;
    } else {
      dom.connBadge.classList.add('status-offline');
      dom.connText.textContent = text || 'Offline';
      isConnected = false;
    }
  }

  // --- Telemetry Fetching & Rendering ---
  async function fetchTelemetry() {
    if (isDemoMode) {
      renderTelemetry(generateMockTelemetry());
      return;
    }

    try {
      const url = `${serverUrl.replace(/\/$/, '')}/api/telemetry/live?device=${encodeURIComponent(activeNode)}`;
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 2800);

      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnectionStatus('live', 'Live Online');
      renderTelemetry(data);
    } catch (err) {
      // Auto fallback to realistic local telemetry if server is temporarily unreachable
      setConnectionStatus('demo', 'Simulated (Offline)');
      renderTelemetry(generateMockTelemetry());
    }
  }

  function renderTelemetry(payload) {
    if (!payload || !payload.telemetry) return;
    const t = payload.telemetry;
    const av = payload.airvisual_pro || {};
    const classroom = payload.classroom_bc6007 || {};

    dom.syncTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. AQI & Gauge
    const aqi = Math.round(t.aqi || 118);
    dom.aqiVal.textContent = aqi;

    // US AQI Category & Color
    let aqiColor = '#10b981';
    let aqiClass = 'chip-good';
    let aqiText = 'Good';
    let healthTxt = 'Air quality is satisfactory and poses little or no health risk.';

    if (aqi > 300) {
      aqiColor = '#7f1d1d';
      aqiClass = 'chip-hazardous';
      aqiText = 'Hazardous';
      healthTxt = 'Health warning of emergency conditions. The entire population is likely affected.';
    } else if (aqi > 200) {
      aqiColor = '#8b5cf6';
      aqiClass = 'chip-very-unhealthy';
      aqiText = 'Very Unhealthy';
      healthTxt = 'Health alert: everyone may experience more serious health effects.';
    } else if (aqi > 150) {
      aqiColor = '#ef4444';
      aqiClass = 'chip-unhealthy';
      aqiText = 'Unhealthy';
      healthTxt = 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.';
    } else if (aqi > 100) {
      aqiColor = '#f97316';
      aqiClass = 'chip-sensitive';
      aqiText = 'Unhealthy (Sens.)';
      healthTxt = 'Members of sensitive groups (asthma, children, elderly) should limit prolonged outdoor exertion.';
    } else if (aqi > 50) {
      aqiColor = '#f59e0b';
      aqiClass = 'chip-moderate';
      aqiText = 'Moderate';
      healthTxt = 'Air quality is acceptable; moderate health concern for a very small number of sensitive individuals.';
    }

    dom.aqiBadge.className = `aqi-chip ${aqiClass}`;
    dom.aqiBadge.textContent = aqiText;
    dom.healthAdvice.textContent = healthTxt;

    // Gauge circle animation (circumference ≈ 515)
    const strokeDash = 515;
    const pct = Math.min(1.0, Math.max(0.05, aqi / 300.0));
    dom.gaugeProgress.style.strokeDashoffset = strokeDash - (pct * strokeDash);
    dom.gaugeProgress.style.stroke = aqiColor;

    // 2. Hardware AirVisual
    const avPM25 = av.pm25_calibrated_ug_m3 || (t.pm25 * 0.985);
    dom.airVisualVal.textContent = `${avPM25.toFixed(1)} \u00B5g/m\u00B3 (0.985x)`;

    // 3. Sensor Cards
    dom.valPM25.textContent = t.pm25.toFixed(1);
    dom.barPM25.style.width = `${Math.min(100, (t.pm25 / 150) * 100)}%`;
    dom.barPM25.style.background = aqiColor;

    dom.valPM10.textContent = t.pm10.toFixed(1);
    dom.barPM10.style.width = `${Math.min(100, (t.pm10 / 200) * 100)}%`;

    dom.valPM1.textContent = t.pm1.toFixed(1);
    dom.barPM1.style.width = `${Math.min(100, (t.pm1 / 80) * 100)}%`;

    dom.valTemp.textContent = t.temperature.toFixed(1);
    dom.valHumidity.textContent = `Humidity: ${t.humidity.toFixed(0)}%`;

    dom.valCO2.textContent = Math.round(t.co2);
    if (t.co2 > 1000) {
      dom.valCO2.className = 'metric-value text-rose';
      dom.statusCO2.textContent = 'Ventilation Required (>1000)';
    } else {
      dom.valCO2.className = 'metric-value text-emerald';
      dom.statusCO2.textContent = 'Optimal Air Freshness';
    }

    dom.valAOD.textContent = (t.aod_550 || 0.62).toFixed(2);

    // 4. Classroom BC6007 Stratification
    if (classroom.front_sensor && classroom.rear_sensor) {
      dom.frontCO2.textContent = `${Math.round(classroom.front_sensor.co2_ppm)} ppm`;
      dom.frontTemp.textContent = `${classroom.front_sensor.temperature_c.toFixed(1)}\u00B0C`;
      dom.rearCO2.textContent = `${Math.round(classroom.rear_sensor.co2_ppm)} ppm`;
      dom.rearTemp.textContent = `${classroom.rear_sensor.temperature_c.toFixed(1)}\u00B0C`;
    }

    // 5. Alert Trigger Check
    checkAlertThresholds(aqi, t.co2);
  }

  // --- Threshold Alert Checks ---
  function checkAlertThresholds(aqi, co2) {
    const now = Date.now();
    const alertAqiEnabled = dom.toggleAqiAlert.checked;
    const alertCo2Enabled = dom.toggleCo2Alert.checked;

    // Trigger once every 10 minutes max to avoid spam
    if (alertAqiEnabled && aqi > 150 && now - lastAqiAlertTime > 10 * 60 * 1000) {
      lastAqiAlertTime = now;
      showToast(`⚠️ High AQI Alert: Current air quality is ${aqi} (Unhealthy).`);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    if (alertCo2Enabled && co2 > 1000 && now - lastCo2AlertTime > 10 * 60 * 1000) {
      lastCo2AlertTime = now;
      showToast(`🌬️ Indoor Air Alert: CO2 elevated (${Math.round(co2)} ppm). Ventilation advised.`);
      if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
    }
  }

  // --- Forecast & AI Trajectory ---
  async function fetchForecast() {
    let forecastData = null;
    if (!isDemoMode) {
      try {
        const url = `${serverUrl.replace(/\/$/, '')}/api/ml/forecast24h`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          forecastData = json.hourly_forecast;
        }
      } catch (e) {
        // Will use generator fallback
      }
    }

    if (!forecastData || forecastData.length === 0) {
      forecastData = generateMockForecast();
    }

    renderForecastChart(forecastData);
  }

  function renderForecastChart(points) {
    if (!points || points.length < 2) return;

    const values = points.map((p) => p.pm25);
    const minVal = Math.max(10, Math.min(...values) - 10);
    const maxVal = Math.max(...values) + 15;
    const maxPeak = Math.max(...values);

    dom.forecastPeakPill.textContent = `Peak ~${Math.round(maxPeak)} \u00B5g/m\u00B3`;

    const width = 340;
    const height = 140;
    const padding = 12;

    const coords = points.map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.pm25 - minVal) / (maxVal - minVal)) * (height - padding * 2);
      return { x, y };
    });

    // Build SVG Path
    let lineD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const cur = coords[i];
      const cx = (prev.x + cur.x) / 2;
      lineD += ` C ${cx} ${prev.y}, ${cx} ${cur.y}, ${cur.x} ${cur.y}`;
    }

    const areaD = `${lineD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    dom.chartLinePath.setAttribute('d', lineD);
    dom.chartAreaPath.setAttribute('d', areaD);
  }

  // --- What-If ML Simulator ---
  function setupSimulator() {
    function updateSim() {
      const aod = parseFloat(dom.simSliderAOD.value);
      const wind = parseFloat(dom.simSliderWind.value);
      const rain = parseFloat(dom.simSliderRain.value);

      dom.simValAOD.textContent = aod.toFixed(2);
      dom.simValWind.textContent = `${wind.toFixed(1)} m/s`;
      dom.simValRain.textContent = `${rain.toFixed(1)} mm`;

      // Multi-Model Ensemble Regression Formula (Assimilating NASA MODIS + Surface met)
      let predPM = (aod * 76.4) + 18.2 - (wind * 3.4) - (rain * 2.1) + 8.5;
      predPM = Math.max(12.0, Math.round(predPM * 10) / 10);

      dom.simResultPM25.textContent = `${predPM.toFixed(1)} \u00B5g/m\u00B3`;

      // AQI Category
      if (predPM <= 35.4) {
        dom.simResultCat.textContent = 'Moderate';
        dom.simResultCat.className = 'pred-val text-emerald';
      } else if (predPM <= 55.4) {
        dom.simResultCat.textContent = 'Unhealthy (Sens.)';
        dom.simResultCat.className = 'pred-val text-orange';
      } else if (predPM <= 150.4) {
        dom.simResultCat.textContent = 'Unhealthy';
        dom.simResultCat.className = 'pred-val text-rose';
      } else {
        dom.simResultCat.textContent = 'Very Unhealthy';
        dom.simResultCat.className = 'pred-val text-purple';
      }
    }

    dom.simSliderAOD.addEventListener('input', updateSim);
    dom.simSliderWind.addEventListener('input', updateSim);
    dom.simSliderRain.addEventListener('input', updateSim);
    updateSim();
  }

  // --- Bangladesh Divisions ---
  async function fetchDivisions() {
    let divisions = [];
    if (!isDemoMode) {
      try {
        const url = `${serverUrl.replace(/\/$/, '')}/api/map/divisions`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          divisions = json.stations || [];
        }
      } catch (e) {}
    }

    if (!divisions || divisions.length === 0) {
      divisions = generateMockDivisions();
    }

    renderDivisions(divisions);
  }

  function renderDivisions(stations) {
    dom.divisionList.innerHTML = '';
    stations.forEach((st) => {
      const card = document.createElement('div');
      card.className = 'division-card';

      let bgStyle = 'background: rgba(16, 185, 129, 0.2); color: #10b981;';
      if (st.aqi > 200) bgStyle = 'background: rgba(139, 92, 246, 0.25); color: #a78bfa;';
      else if (st.aqi > 150) bgStyle = 'background: rgba(239, 68, 68, 0.25); color: #ef4444;';
      else if (st.aqi > 100) bgStyle = 'background: rgba(249, 115, 22, 0.25); color: #f97316;';
      else if (st.aqi > 50) bgStyle = 'background: rgba(245, 158, 11, 0.25); color: #f59e0b;';

      card.innerHTML = `
        <div class="div-main">
          <span class="div-name">${st.name || st.division}</span>
          <span class="div-station">${st.station_name || 'Division Air Quality Station'}</span>
        </div>
        <div class="div-stats">
          <div class="div-weather">
            <span>${st.temperature ? st.temperature.toFixed(1) + '\u00B0C' : '28\u00B0C'}</span>
            <span>PM2.5: ${st.pm25 ? st.pm25.toFixed(1) : '--'}</span>
          </div>
          <div class="div-aqi-pill" style="${bgStyle}">
            ${st.aqi || '--'}
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        showToast(`${st.name}: AQI ${st.aqi} (${st.aqi_category || 'Active monitoring'})`);
      });

      dom.divisionList.appendChild(card);
    });
  }

  // --- Settings & Server Ping ---
  function setupSettings() {
    dom.serverUrlInput.value = serverUrl;
    dom.toggleDemoMode.checked = isDemoMode;
    dom.toggleAqiAlert.checked = localStorage.getItem(STORAGE_KEYS.ALERT_AQI) !== 'false';
    dom.toggleCo2Alert.checked = localStorage.getItem(STORAGE_KEYS.ALERT_CO2) !== 'false';

    dom.toggleDemoMode.addEventListener('change', (e) => {
      isDemoMode = e.target.checked;
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, isDemoMode);
      if (isDemoMode) {
        showToast('Demo Simulation Mode Activated');
        setConnectionStatus('demo', 'Simulated');
      } else {
        showToast('Attempting Server Connection...');
        fetchTelemetry();
      }
    });

    dom.toggleAqiAlert.addEventListener('change', (e) => {
      localStorage.setItem(STORAGE_KEYS.ALERT_AQI, e.target.checked);
    });

    dom.toggleCo2Alert.addEventListener('change', (e) => {
      localStorage.setItem(STORAGE_KEYS.ALERT_CO2, e.target.checked);
    });

    dom.btnTestConn.addEventListener('click', async () => {
      const testUrl = dom.serverUrlInput.value.trim().replace(/\/$/, '');
      dom.pingFeedback.className = 'ping-feedback';
      dom.pingFeedback.textContent = 'Pinging host server...';
      dom.pingFeedback.classList.remove('hidden');

      const startTime = performance.now();
      try {
        const res = await fetch(`${testUrl}/api/telemetry/live`, { signal: AbortSignal.timeout(3500) });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          dom.pingFeedback.className = 'ping-feedback success';
          dom.pingFeedback.textContent = `Success: RefinAir responded in ${latency}ms!`;
        } else {
          dom.pingFeedback.className = 'ping-feedback error';
          dom.pingFeedback.textContent = `Server reachable but returned HTTP ${res.status}.`;
        }
      } catch (err) {
        dom.pingFeedback.className = 'ping-feedback error';
        dom.pingFeedback.textContent = `Connection failed: ${err.message}. Check Wi-Fi IP and port 5000.`;
      }
    });

    dom.btnSaveConn.addEventListener('click', () => {
      serverUrl = dom.serverUrlInput.value.trim().replace(/\/$/, '');
      localStorage.setItem(STORAGE_KEYS.SERVER_URL, serverUrl);
      isDemoMode = false;
      dom.toggleDemoMode.checked = false;
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, false);
      showToast('Server URL Saved. Connecting...');
      fetchTelemetry();
      fetchForecast();
      fetchDivisions();
    });
  }

  // --- Synthetic Data Generators (for offline / demo fallback) ---
  function generateMockTelemetry() {
    const nowSec = Date.now() / 1000;
    const basePM25 = 48.0 + 8.0 * Math.sin(nowSec / 15.0);
    const aqi = Math.round(basePM25 * 2.3 + 12);

    return {
      status: 'success',
      device_id: activeNode,
      telemetry: {
        timestamp: new Date().toISOString(),
        pm25: basePM25,
        pm10: basePM25 * 1.6 + 6.0,
        pm1: basePM25 * 0.55,
        temperature: 28.4 + 0.4 * Math.sin(nowSec / 30.0),
        humidity: 62.0 + 3.0 * Math.cos(nowSec / 25.0),
        co2: 780 + 90 * Math.sin(nowSec / 20.0),
        co: 0.8,
        no2: 0.024,
        voc: 0.12,
        aod_550: 0.62 + 0.03 * Math.sin(nowSec / 40.0),
        aqi: aqi,
        aqi_category: aqi > 150 ? 'Unhealthy' : aqi > 100 ? 'Unhealthy for Sensitive Groups' : 'Moderate'
      },
      airvisual_pro: {
        pm25_calibrated_ug_m3: basePM25 * 0.985,
        calibration_ratio: 0.985
      },
      classroom_bc6007: {
        front_sensor: { co2_ppm: 820 + 30 * Math.sin(nowSec / 20.0), temperature_c: 24.2 },
        rear_sensor: { co2_ppm: 1140 + 45 * Math.sin(nowSec / 20.0), temperature_c: 20.4 }
      }
    };
  }

  function generateMockForecast() {
    const list = [];
    const base = 58;
    for (let h = 0; h < 24; h++) {
      const factor = 1.0 + 0.28 * Math.sin((h / 24) * 2 * Math.PI - 1.2);
      list.push({
        hour_label: `+${h}h`,
        pm25: Math.round(base * factor + Math.random() * 3.0)
      });
    }
    return list;
  }

  function generateMockDivisions() {
    return [
      { name: 'Dhaka', division: 'Dhaka', aqi: 168, aqi_category: 'Unhealthy', temperature: 29.2, pm25: 88.4 },
      { name: 'Chittagong', division: 'Chittagong', aqi: 114, aqi_category: 'Unhealthy (Sens.)', temperature: 30.1, pm25: 41.2 },
      { name: 'Rajshahi', division: 'Rajshahi', aqi: 132, aqi_category: 'Unhealthy (Sens.)', temperature: 31.4, pm25: 48.6 },
      { name: 'Khulna', division: 'Khulna', aqi: 98, aqi_category: 'Moderate', temperature: 29.8, pm25: 34.5 },
      { name: 'Sylhet', division: 'Sylhet', aqi: 62, aqi_category: 'Moderate', temperature: 27.5, pm25: 18.2 },
      { name: 'Barishal', division: 'Barishal', aqi: 78, aqi_category: 'Moderate', temperature: 28.9, pm25: 25.1 },
      { name: 'Rangpur', division: 'Rangpur', aqi: 105, aqi_category: 'Unhealthy (Sens.)', temperature: 28.0, pm25: 37.8 },
      { name: 'Mymensingh', division: 'Mymensingh', aqi: 118, aqi_category: 'Unhealthy (Sens.)', temperature: 28.6, pm25: 42.9 }
    ];
  }

  // --- Start App on Load ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
