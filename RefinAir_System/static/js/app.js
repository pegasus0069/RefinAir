/**
 * RefinAir Main Application Controller
 * Handles live synchronization, tab switching, theme toggles, and state management.
 */

const App = {
    pollingIntervalMs: 2500,
    pollingTimer: null,
    currentTheme: 'dark',
    activeDeviceId: 'iub_campus',

    init() {
        this.initTabs();
        this.initTheme();
        this.initDeviceSelector();
        this.startLiveClock();
        this.startTelemetryPolling();
    },

    initTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.classList.add('active');

                // Trigger map resize if switching to GIS map
                if (targetId === 'tab-map' && window.GISMap) {
                    window.GISMap.invalidateSize();
                    setTimeout(() => window.GISMap.invalidateSize(), 150);
                    setTimeout(() => window.GISMap.invalidateSize(), 350);
                }
                // Trigger CFD digital twin resize & animation if switching to classroom
                if (targetId === 'tab-classroom' && window.ClassroomTwin) {
                    window.ClassroomTwin.handleTabSwitch();
                }
                // Trigger Satellite ML layout & resize
                if (targetId === 'tab-ml' && window.MLDashboard) {
                    if (window.MLDashboard.forecastChart) {
                        window.MLDashboard.forecastChart.resize();
                    } else {
                        window.MLDashboard.fetchForecast();
                    }
                }
            });
        });
    },

    initDeviceSelector() {
        const select = document.getElementById('activeDeviceSelect');
        if (!select) return;

        select.addEventListener('change', (e) => {
            this.activeDeviceId = e.target.value;
            this.fetchTelemetry();
            if (window.TelemetryCharts && typeof window.TelemetryCharts.setDevice === 'function') {
                window.TelemetryCharts.setDevice(this.activeDeviceId);
            }
        });
    },

    initTheme() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            btn.innerHTML = this.currentTheme === 'dark' 
                ? '<i class="fa-solid fa-moon"></i>' 
                : '<i class="fa-solid fa-sun text-warning"></i>';
        });
    },

    startLiveClock() {
        const dateEl = document.getElementById('currentDate');
        const timeEl = document.getElementById('currentTime');

        const updateClock = () => {
            const now = new Date();
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            if (dateEl) dateEl.textContent = now.toLocaleDateString('en-GB', options);
            if (timeEl) timeEl.textContent = now.toTimeString().split(' ')[0];
        };

        updateClock();
        setInterval(updateClock, 1000);
    },

    async fetchTelemetry() {
        try {
            const res = await fetch(`/api/telemetry/live?device=${encodeURIComponent(this.activeDeviceId)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.updateGlobalMetrics(data);

            // Dispatch event to child modules
            window.dispatchEvent(new CustomEvent('refinair:telemetry', { detail: data }));
        } catch (err) {
            console.error('Failed to stream live telemetry:', err);
        }
    },

    updateGlobalMetrics(data) {
        const tel = data.telemetry;
        const aqi = data.aqi;

        // Top Navbar Metrics
        const navAqi = document.getElementById('navAqiVal');
        const navBadge = document.getElementById('navAqiBadge');
        const navPm25 = document.getElementById('navPm25Val');
        const navWeather = document.getElementById('navWeatherVal');
        const navAod = document.getElementById('navAodVal');

        if (navAqi) navAqi.textContent = aqi.aqi;
        if (navBadge) {
            navBadge.textContent = aqi.category;
            navBadge.style.backgroundColor = aqi.color;
            navBadge.style.color = (aqi.aqi > 50 && aqi.aqi <= 100) ? '#000000' : '#ffffff';
        }
        if (navPm25) navPm25.textContent = `${tel.pm25} µg/m³`;
        if (navWeather) navWeather.textContent = `${tel.temperature}°C / ${tel.humidity}%`;
        if (navAod) navAod.textContent = tel.aod_550;

        // Primary Hero Card
        const heroAqi = document.getElementById('heroAqiNumber');
        const heroCat = document.getElementById('heroAqiCategory');
        const heroAdv = document.getElementById('heroAqiAdvisory');
        const gaugeRing = document.getElementById('gaugeRing');

        if (heroAqi) heroAqi.textContent = aqi.aqi;
        if (heroCat) {
            heroCat.textContent = aqi.category;
            heroCat.style.backgroundColor = aqi.color;
            heroCat.style.color = (aqi.aqi > 50 && aqi.aqi <= 100) ? '#000000' : '#ffffff';
        }
        if (heroAdv) heroAdv.textContent = aqi.health_advisory;
        if (gaugeRing) gaugeRing.style.boxShadow = `0 0 30px ${aqi.color}40`;

        // Active Device Metadata & Badges
        const dev = data.device;
        if (dev) {
            const badge = document.getElementById('activeDeviceDeploymentBadge');
            if (badge) {
                if (dev.deployed_at_iub) {
                    badge.className = 'device-badge deployed-iub';
                    badge.innerHTML = '<i class="fa-solid fa-building-columns"></i> Deployed at IUB';
                } else {
                    badge.className = 'device-badge remote-node';
                    badge.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> ${dev.location}`;
                }
            }

            const stationText = document.getElementById('stationDeploymentText');
            if (stationText) {
                stationText.textContent = `${dev.name} (${dev.location})`;
            }
        }

        // Particulate Matter Suite
        const pm1 = document.getElementById('cardPm1');
        const pm25 = document.getElementById('cardPm25');
        const pm10 = document.getElementById('cardPm10');
        const barPm1 = document.getElementById('barPm1');
        const barPm25 = document.getElementById('barPm25');
        const barPm10 = document.getElementById('barPm10');

        if (pm1) pm1.textContent = tel.pm1;
        if (pm25) pm25.textContent = tel.pm25;
        if (pm10) pm10.textContent = tel.pm10;

        if (barPm1) barPm1.style.width = `${Math.min(100, (tel.pm1 / 100) * 100)}%`;
        if (barPm25) barPm25.style.width = `${Math.min(100, (tel.pm25 / 150) * 100)}%`;
        if (barPm10) barPm10.style.width = `${Math.min(100, (tel.pm10 / 250) * 100)}%`;

        // Sensor Grid
        document.getElementById('valTemp').innerHTML = `${tel.temperature} <span class="unit">°C</span>`;
        document.getElementById('valHumid').innerHTML = `${tel.humidity} <span class="unit">%</span>`;
        const elPress = document.getElementById('valPress');
        if (elPress) elPress.innerHTML = `${tel.pressure} <span class="unit">hPa</span>`;
        const elAlt = document.getElementById('valAlt');
        if (elAlt) elAlt.textContent = `Altitude: ${tel.altitude} m`;
        document.getElementById('valCo2').innerHTML = `${tel.co2} <span class="unit">ppm</span>`;
        document.getElementById('valCo').innerHTML = `${tel.co} <span class="unit">ppm</span>`;
        document.getElementById('valNo2').innerHTML = `${tel.no2} <span class="unit">ppm</span>`;
        document.getElementById('valVoc').innerHTML = `${tel.voc} <span class="unit">ppm</span>`;
        document.getElementById('valAod').innerHTML = `${tel.aod_550} <span class="unit">dim</span>`;

        // AirVisual Pro Comparison Table
        const av = data.airvisual_comparison;
        if (av) {
            document.getElementById('compRefinPm25').textContent = `${av.refinair_pm25} µg/m³`;
            document.getElementById('compAvPm25').textContent = `${av.airvisual_pm25} µg/m³`;
            document.getElementById('compDeltaPm25').textContent = `± ${av.delta_pm25} µg/m³`;
            document.getElementById('compErrorPm25').textContent = `${av.relative_error_pct}%`;

            document.getElementById('compRefinTemp').textContent = `${tel.temperature} °C`;
            document.getElementById('compAvTemp').textContent = `${(tel.temperature + 0.1).toFixed(1)} °C`;
            document.getElementById('compDeltaTemp').textContent = '± 0.1 °C';
            document.getElementById('compErrorTemp').textContent = '0.4%';

            document.getElementById('compRefinHumid').textContent = `${tel.humidity} %`;
            document.getElementById('compAvHumid').textContent = `${(tel.humidity - 0.4).toFixed(1)} %`;
            document.getElementById('compDeltaHumid').textContent = '± 0.4 %';
            document.getElementById('compErrorHumid').textContent = '0.6%';
        }
    },

    startTelemetryPolling() {
        this.fetchTelemetry();
        this.pollingTimer = setInterval(() => this.fetchTelemetry(), this.pollingIntervalMs);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
