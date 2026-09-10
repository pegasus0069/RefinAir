/**
 * RefinAir Atmospheric GIS Map Controller
 * Powered by Leaflet.js: Division Stations and Industrial Surveillance Corridors
 */

const GISMap = {
    map: null,
    layers: {
        divisions: null,
        industrial: null
    },
    activeLayers: {
        divisions: true,
        industrial: true
    },
    markers: {
        divisions: [],
        industrial: []
    },

    init() {
        const mapContainer = document.getElementById('gisMap');
        if (!mapContainer) return;

        // Initialize Leaflet map centered over Bangladesh
        this.map = L.map('gisMap', {
            center: [23.8103, 90.4125],
            zoom: 7,
            zoomControl: true
        });

        // Basemap (CartoDB Voyager)
        L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_310j_1_9e8e53a2451584a1c7c65efc', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        this.layers.divisions = L.layerGroup().addTo(this.map);
        this.layers.industrial = L.layerGroup().addTo(this.map);

        this.initControls();
        this.loadDivisionStations();
        this.loadIndustrialZones();

        // Refresh division stations periodically
        setInterval(() => {
            this.loadDivisionStations();
        }, 10000);
    },

    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    },

    initControls() {
        const pillDiv = document.getElementById('layerDivisions');
        const pillInd = document.getElementById('layerIndustrial');

        const toggle = (btn, layerKey) => {
            btn.addEventListener('click', () => {
                this.activeLayers[layerKey] = !this.activeLayers[layerKey];
                btn.classList.toggle('active', this.activeLayers[layerKey]);
                if (this.activeLayers[layerKey]) {
                    this.map.addLayer(this.layers[layerKey]);
                } else {
                    this.map.removeLayer(this.layers[layerKey]);
                }
            });
        };

        if (pillDiv) toggle(pillDiv, 'divisions');
        if (pillInd) toggle(pillInd, 'industrial');
    },

    getAqiTextColor(aqi, hexColor) {
        // High-contrast text readability: Black for yellow/amber/moderate/sensitive, white for dark backgrounds
        if (hexColor && typeof hexColor === 'string') {
            const c = hexColor.toLowerCase();
            if (c.includes('ea') || c.includes('fb') || c.includes('fa') || c.includes('ff') || c.includes('yellow') || c.includes('amber')) {
                return '#000000';
            }
            if (c.startsWith('#')) {
                let hex = c.replace('#', '');
                if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
                const r = parseInt(hex.substring(0, 2), 16) || 0;
                const g = parseInt(hex.substring(2, 4), 16) || 0;
                const b = parseInt(hex.substring(4, 6), 16) || 0;
                const yiq = (r * 299 + g * 587 + b * 114) / 1000;
                if (yiq >= 135) return '#000000';
            }
        }
        if (aqi >= 51 && aqi <= 120) return '#000000';
        return '#ffffff';
    },

    async loadDivisionStations() {
        try {
            const res = await fetch('/api/map/divisions');
            if (!res.ok) return;
            const data = await res.json();
            const stations = data.stations || [];

            this.layers.divisions.clearLayers();
            const miniGrid = document.getElementById('divisionsMiniGrid');
            if (miniGrid) miniGrid.innerHTML = '';

            stations.forEach(s => {
                const textColor = this.getAqiTextColor(s.aqi, s.color);
                const isLightAqi = textColor === '#000000';

                const icon = L.divIcon({
                    className: 'division-marker-icon',
                    html: `<div style="background:${s.color}; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:${textColor}; border:2px solid ${isLightAqi ? '#0f172a' : '#ffffff'}; box-shadow:0 3px 10px rgba(0,0,0,0.45); cursor:pointer;">
                             <i class="fa-solid fa-tower-cell" style="font-size:12px; color:${textColor};"></i>
                           </div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                });

                const marker = L.marker([s.lat, s.lng], { icon: icon });

                marker.bindTooltip(`<strong>${s.name}</strong><br>AQI: ${s.aqi} (${s.category})<br>PM2.5: ${s.pm25} µg/m³`, {
                    direction: 'top',
                    className: 'map-tooltip'
                });

                marker.on('click', () => this.showStationDetails(s));
                this.layers.divisions.addLayer(marker);

                // Populate Division Quick Selector
                if (miniGrid) {
                    const item = document.createElement('div');
                    item.className = 'station-quick-item';
                    item.innerHTML = `
                        <div class="quick-station-name">${s.name}</div>
                        <div class="quick-station-aqi" style="background:${s.color}; color:${textColor}; font-weight:800;">AQI ${s.aqi}</div>
                    `;
                    item.addEventListener('click', () => {
                        this.map.flyTo([s.lat, s.lng], 9, { duration: 1.0 });
                        this.showStationDetails(s);
                    });
                    miniGrid.appendChild(item);
                }
            });
        } catch (e) {
            console.error('Error loading division stations:', e);
        }
    },

    async loadIndustrialZones() {
        try {
            const res = await fetch('/api/map/industrial');
            if (!res.ok) return;
            const data = await res.json();
            const zones = data.zones || [];

            this.layers.industrial.clearLayers();
            zones.forEach(z => {
                // Outer dispersion radius circle
                const circle = L.circle([z.lat, z.lng], {
                    radius: 9000,
                    color: z.color,
                    fillColor: z.color,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: '4, 4'
                });

                const iconColor = this.getAqiTextColor(z.aqi, z.color);
                const isLightAqi = iconColor === '#000000';

                const icon = L.divIcon({
                    className: 'industrial-marker-icon',
                    html: `<div style="background:${z.color}; width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:${iconColor}; border:2px solid ${isLightAqi ? '#0f172a' : '#ffffff'}; box-shadow:0 3px 10px rgba(0,0,0,0.45); cursor:pointer;">
                             <i class="fa-solid fa-industry" style="font-size:12px; color:${iconColor};"></i>
                           </div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                });

                const marker = L.marker([z.lat, z.lng], { icon: icon });
                marker.bindTooltip(`<strong>${z.name}</strong><br>Industry: ${z.industry}<br>AQI: ${z.aqi}`, {
                    direction: 'top',
                    className: 'map-tooltip'
                });

                marker.on('click', () => this.showIndustrialDetails(z));
                this.layers.industrial.addLayer(circle);
                this.layers.industrial.addLayer(marker);
            });
        } catch (e) {
            console.error('Error loading industrial zones:', e);
        }
    },

    showStationDetails(s) {
        const el = document.getElementById('selectedStationDetails');
        if (!el) return;

        const textColor = this.getAqiTextColor(s.aqi, s.color);
        const sourceLabel = s.source || 'Copernicus CAMS & ECMWF Live Feed';
        const syncTime = s.last_synced ? `Synced ${s.last_synced.split(' ')[1]}` : 'Live Real-Time';

        el.innerHTML = `
            <div style="background:var(--bg-surface); padding:16px; border-radius:12px; border:1px solid var(--border-subtle); margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <h3 style="font-family:var(--font-display); font-size:16px; margin:0; color:var(--text-primary);">${s.name}</h3>
                    <span class="station-aqi-badge" style="background:${s.color}; color:${textColor}; padding:3px 9px; border-radius:6px; font-size:12px; font-weight:800; letter-spacing:0.3px;">AQI ${s.aqi}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:11px; color:var(--text-muted);">
                    <span>${s.type}</span>
                    <span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-circle-dot" style="font-size:8px;"></i> ${syncTime}</span>
                </div>
                
                <div style="display:inline-flex; align-items:center; gap:6px; font-size:11px; color:#38bdf8; background:rgba(56, 189, 248, 0.08); border:1px solid rgba(56, 189, 248, 0.2); padding:4px 9px; border-radius:6px; margin-bottom:12px; width:100%;">
                    <i class="fa-solid fa-satellite text-primary"></i> <span><strong>Live Feed:</strong> ${sourceLabel}</span>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; margin-bottom:12px;">
                    <div>PM2.5: <strong>${s.pm25} µg/m³</strong></div>
                    <div>PM10: <strong>${s.pm10} µg/m³</strong></div>
                    <div>Temp: <strong>${s.temperature} °C</strong></div>
                    <div>Humidity: <strong>${s.humidity} %</strong></div>
                    <div>Wind: <strong>${s.wind_speed != null ? s.wind_speed + ' km/h' : '--'}</strong></div>
                    <div>Pressure: <strong>${s.pressure != null ? s.pressure + ' hPa' : '--'}</strong></div>
                    <div>Satellite AOD: <strong>${s.aod_550}</strong></div>
                    <div>Category: <strong>${s.category}</strong></div>
                </div>

                ${(s.co || s.no2 || s.so2) ? `
                <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:8px; padding:8px 10px; margin-bottom:12px;">
                    <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;"><i class="fa-solid fa-smog text-accent"></i> Gaseous Pollutants (CAMS Assimilation)</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; font-size:11px;">
                        <div>CO: <strong>${s.co || '--'} µg/m³</strong></div>
                        <div>NO₂: <strong>${s.no2 || '--'} µg/m³</strong></div>
                        <div>SO₂: <strong>${s.so2 || '--'} µg/m³</strong></div>
                    </div>
                </div>` : ''}

                <div style="background:rgba(255,255,255,0.04); padding:8px 10px; border-radius:6px; font-size:11px; color:var(--text-secondary);">
                    <i class="fa-solid fa-circle-info text-info"></i> ${s.health_advisory}
                </div>
            </div>
        `;
    },

    showIndustrialDetails(z) {
        const el = document.getElementById('selectedStationDetails');
        if (!el) return;

        const textColor = this.getAqiTextColor(z.aqi, z.color);
        const sourceLabel = z.source || 'Copernicus CAMS Industrial Surveillance';
        const syncTime = z.last_synced ? `Synced ${z.last_synced.split(' ')[1]}` : 'Live Real-Time';

        el.innerHTML = `
            <div style="background:var(--bg-surface); padding:16px; border-radius:12px; border:1px solid var(--border-subtle); margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <h3 style="font-family:var(--font-display); font-size:16px; margin:0; color:var(--text-primary);">${z.name}</h3>
                    <span class="station-aqi-badge" style="background:${z.color}; color:${textColor}; padding:3px 9px; border-radius:6px; font-size:12px; font-weight:800; letter-spacing:0.3px;">AQI ${z.aqi}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:11px; color:var(--text-muted);">
                    <span>${z.industry}</span>
                    <span style="color:#10b981; font-weight:600;"><i class="fa-solid fa-circle-dot" style="font-size:8px;"></i> ${syncTime}</span>
                </div>

                <div style="display:inline-flex; align-items:center; gap:6px; font-size:11px; color:#f59e0b; background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.2); padding:4px 9px; border-radius:6px; margin-bottom:12px; width:100%;">
                    <i class="fa-solid fa-industry text-warning"></i> <span><strong>Live Feed:</strong> ${sourceLabel}</span>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; margin-bottom:12px;">
                    <div>PM2.5: <strong>${z.pm25} µg/m³</strong></div>
                    <div>PM10: <strong>${z.pm10 || '--'} µg/m³</strong></div>
                    <div>NO₂: <strong>${z.no2} µg/m³</strong></div>
                    <div>SO₂: <strong>${z.so2 || '--'} µg/m³</strong></div>
                    <div>CO: <strong>${z.co || '--'} µg/m³</strong></div>
                    <div>Temp: <strong>${z.temperature != null ? z.temperature + ' °C' : '--'}</strong></div>
                    <div>Humidity: <strong>${z.humidity != null ? z.humidity + ' %' : '--'}</strong></div>
                    <div>Category: <strong>${z.category}</strong></div>
                </div>

                <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); padding:8px 10px; border-radius:6px; font-size:11px; color:#f87171;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Continuous industrial emission surveillance active. Automated dispersion alert perimeter maintained.
                </div>
            </div>
        `;
    }
};

window.GISMap = GISMap;
document.addEventListener('DOMContentLoaded', () => GISMap.init());
