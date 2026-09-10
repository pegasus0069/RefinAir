/**
 * RefinAir Classroom IAQ Digital Twin (Room BC6007 at IUB)
 * Real-Time 2D CFD Heat Map & 10-Node Spatial Mesh Engine
 * Powered by Inverse Distance Weighting (IDW) interpolation from CFD_new_data dataset.
 */

const ClassroomTwin = {
    canvas: null,
    ctx: null,
    currentMode: 'temp', // 'temp', 'co2', 'pm25', 'velocity', 'overview'
    selectedNodeId: 1,
    nodesData: [],
    analyticsData: {},
    animationFrame: null,
    particles: [],

    // Layer display toggles
    showHeatmap: true,
    showIsobars: true,
    showNodes: true,
    showParticles: true,

    // Offscreen buffer for fast scalar field generation
    gridW: 110,
    gridH: 65,
    offCanvas: null,
    offCtx: null,

    init() {
        this.canvas = document.getElementById('cfdOverlayCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.offCanvas = document.createElement('canvas');
            this.offCanvas.width = this.gridW;
            this.offCanvas.height = this.gridH;
            this.offCtx = this.offCanvas.getContext('2d');
        }

        this.initControls();
        this.initParticles();
        this.resizeCanvas();
        this.fetchSpatialData();
        this.render3DSlice();

        // Periodically refresh spatial readings
        setInterval(() => this.fetchSpatialData(), 3000);

        // Resize on window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
            this.render3DSlice();
        });

        // Start continuous render loop for particles / fluid dynamics
        this.startLoop();
    },

    handleTabSwitch() {
        // Called whenever the user clicks the Classroom tab
        this.resizeCanvas();
        this.render();
        this.render3DSlice();
        setTimeout(() => {
            this.resizeCanvas();
            this.render();
            this.render3DSlice();
        }, 80);
        setTimeout(() => {
            this.resizeCanvas();
            this.render();
            this.render3DSlice();
        }, 250);
    },

    resizeCanvas() {
        if (!this.canvas) return;
        const box = document.getElementById('classroomRoom');
        if (!box) return;
        const rect = box.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
            const rw = Math.round(rect.width);
            const rh = Math.round(rect.height);
            if (this.canvas.width !== rw || this.canvas.height !== rh) {
                this.canvas.width = rw;
                this.canvas.height = rh;
            }
        }
    },

    initControls() {
        // Mode Pills
        const pills = document.querySelectorAll('.cfd-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentMode = pill.getAttribute('data-cfd');
                this.updateLegend();
                this.render();
                this.render3DSlice();
            });
        });

        // Layer Toggles
        const chkHeatmap = document.getElementById('cfdToggleHeatmap');
        const chkIsobars = document.getElementById('cfdToggleIsobars');
        const chkNodes = document.getElementById('cfdToggleNodes');
        const chkParticles = document.getElementById('cfdToggleParticles');

        if (chkHeatmap) {
            chkHeatmap.addEventListener('change', (e) => {
                this.showHeatmap = e.target.checked;
                this.render();
            });
        }
        if (chkIsobars) {
            chkIsobars.addEventListener('change', (e) => {
                this.showIsobars = e.target.checked;
                this.render();
            });
        }
        if (chkNodes) {
            chkNodes.addEventListener('change', (e) => {
                this.showNodes = e.target.checked;
                const overlay = document.getElementById('spatialNodesOverlay');
                if (overlay) overlay.style.display = this.showNodes ? 'block' : 'none';
            });
        }
        if (chkParticles) {
            chkParticles.addEventListener('change', (e) => {
                this.showParticles = e.target.checked;
                this.render();
            });
        }

        // 2D CAD vs 3D CFD Slice View Toggle
        const btn2D = document.getElementById('viewMode2D');
        const btn3D = document.getElementById('viewMode3D');
        const room2D = document.getElementById('classroomRoom');
        const panel3D = document.getElementById('classroomCfd3DPanel');

        if (btn2D && btn3D && room2D && panel3D) {
            btn2D.addEventListener('click', () => {
                btn2D.classList.add('active');
                btn3D.classList.remove('active');
                room2D.style.display = 'block';
                panel3D.style.display = 'none';
                this.resizeCanvas();
                this.render();
            });

            btn3D.addEventListener('click', () => {
                btn3D.classList.add('active');
                btn2D.classList.remove('active');
                room2D.style.display = 'none';
                panel3D.style.display = 'block';
                this.render3DSlice();
            });
        }
    },

    initParticles() {
        this.particles = [];
        // Supply jets originating from North Wall Split AC unit (x: ~5%, y: 36% - 52%) blowing across student seating
        for (let i = 0; i < 75; i++) {
            this.particles.push({
                x: 0.05 + Math.random() * 0.04,
                y: 0.36 + Math.random() * 0.16,
                vx: 0.003 + Math.random() * 0.005, // Blows eastward across room towards student seating
                vy: (Math.random() - 0.5) * 0.0018,
                life: Math.random() * 100,
                maxLife: 90 + Math.random() * 60,
                radius: 1.2 + Math.random() * 1.8,
                alpha: 0.35 + Math.random() * 0.45
            });
        }
    },

    async fetchSpatialData() {
        try {
            const res = await fetch('/api/classroom/spatial_nodes');
            if (!res.ok) return;
            const json = await res.json();
            const data = json.data;
            if (!data) return;

            this.nodesData = data.nodes || [];
            this.analyticsData = data.analytics || {};

            this.updateNodeMarkers();
            this.updateInspector(this.selectedNodeId);
            this.updateAnalyticsUI();
            this.updateLegend();
            this.render();
            this.render3DSlice();
        } catch (e) {
            console.error('Failed to load spatial nodes:', e);
        }
    },

    updateNodeMarkers() {
        const container = document.getElementById('spatialNodesOverlay');
        if (!container || !this.nodesData.length) return;

        container.innerHTML = '';
        this.nodesData.forEach(n => {
            const el = document.createElement('div');
            el.className = `node-pin ${n.deviceId === this.selectedNodeId ? 'selected' : ''} ${n.is_elevated ? 'elevated' : 'floor'}`;
            el.style.left = `${n.position_pct.x}%`;
            el.style.top = `${n.position_pct.y}%`;

            let displayVal = '';
            if (this.currentMode === 'temp') displayVal = `${n.air_temperature}°`;
            else if (this.currentMode === 'co2') displayVal = `${n.CO2}`;
            else if (this.currentMode === 'pm25') displayVal = `${n.pm2_5}`;
            else displayVal = `N${n.deviceId}`;

            el.innerHTML = `
                <div class="pin-halo"></div>
                <div class="pin-core">
                    <span class="pin-id">#${n.deviceId}</span>
                    <span class="pin-val">${displayVal}</span>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedNodeId = n.deviceId;
                document.querySelectorAll('.node-pin').forEach(p => p.classList.remove('selected'));
                el.classList.add('selected');
                this.updateInspector(n.deviceId);
            });

            container.appendChild(el);
        });

        // Update list in right sidebar
        this.renderNodesList();
    },

    renderNodesList() {
        const list = document.getElementById('sensorNodesList');
        if (!list || !this.nodesData.length) return;

        list.innerHTML = '';
        this.nodesData.forEach(n => {
            const item = document.createElement('div');
            item.className = `sensor-node-row ${n.deviceId === this.selectedNodeId ? 'active' : ''}`;
            item.innerHTML = `
                <div class="node-row-left">
                    <span class="node-num-badge">N${n.deviceId}</span>
                    <div>
                        <div class="node-row-title">${n.name}</div>
                        <div class="node-row-zone">${n.zone}</div>
                    </div>
                </div>
                <div class="node-row-right">
                    <span class="node-row-val">${n.air_temperature}°C</span>
                    <span class="node-row-sub">${n.CO2} ppm</span>
                </div>
            `;
            item.addEventListener('click', () => {
                this.selectedNodeId = n.deviceId;
                document.querySelectorAll('.node-pin').forEach(p => p.classList.remove('selected'));
                const pin = document.querySelectorAll('.node-pin')[n.deviceId - 1];
                if (pin) pin.classList.add('selected');
                document.querySelectorAll('.sensor-node-row').forEach(r => r.classList.remove('active'));
                item.classList.add('active');
                this.updateInspector(n.deviceId);
            });
            list.appendChild(item);
        });
    },

    updateInspector(deviceId) {
        const node = this.nodesData.find(n => n.deviceId === deviceId) || this.nodesData[0];
        if (!node) return;

        const elBadge = document.getElementById('inspectorNodeBadge');
        const elName = document.getElementById('inspNodeName');
        const elZone = document.getElementById('inspNodeZone');
        const elTemp = document.getElementById('inspTemp');
        const elHumid = document.getElementById('inspHumidity');
        const elCo2 = document.getElementById('inspCo2');
        const elPm25 = document.getElementById('inspPm25');
        const elPm1 = document.getElementById('inspPm1');
        const elPm10 = document.getElementById('inspPm10');
        const elCoords = document.getElementById('inspNodeCoords');

        if (elBadge) elBadge.textContent = `Node ${String(node.deviceId).padStart(2, '0')}`;
        if (elName) elName.textContent = node.name;
        if (elZone) elZone.textContent = `${node.zone} • Height Z = ${node.coords_m.z}m`;
        if (elTemp) elTemp.textContent = `${node.air_temperature} °C`;
        if (elHumid) elHumid.textContent = `${node.humidity} %`;
        if (elCo2) elCo2.textContent = `${node.CO2} ppm`;
        if (elPm25) elPm25.textContent = `${node.pm2_5} µg/m³`;
        if (elPm1) elPm1.textContent = `${node.pm1} µg/m³`;
        if (elPm10) elPm10.textContent = `${node.pm10} µg/m³`;
        if (elCoords) {
            elCoords.textContent = `Physical Coords: X = ${node.coords_m.x}m, Y = ${node.coords_m.y}m, Z = ${node.coords_m.z}m | ${node.role}`;
        }
    },

    updateAnalyticsUI() {
        const a = this.analyticsData;
        if (!a) return;

        const stratVal = document.getElementById('stratDeltaVal');
        const riskPct = document.getElementById('riskPctVal');
        const riskBadge = document.getElementById('riskLevelBadge');
        const riskAdv = document.getElementById('riskAdvisoryText');
        const ventAdv = document.getElementById('ventAdvisoryText');

        if (stratVal) stratVal.textContent = `ΔT = +${a.thermal_stratification_delta} °C`;
        if (riskPct) riskPct.textContent = `${a.infection_risk_pct} %`;

        let riskLabel = 'Low Risk', badgeBg = '#10b981';
        if (a.infection_risk_pct > 35) {
            riskLabel = 'High Risk';
            badgeBg = '#ef4444';
        } else if (a.infection_risk_pct > 15) {
            riskLabel = 'Moderate Risk';
            badgeBg = '#f59e0b';
        }

        if (riskBadge) {
            riskBadge.textContent = riskLabel;
            riskBadge.style.backgroundColor = badgeBg;
        }

        if (riskAdv) {
            riskAdv.textContent = `Exhaled peak CO₂ at ${a.peak_co2} ppm indicates ${a.is_class_hours ? 'high class occupancy' : 'baseline background conditions'}.`;
        }

        if (ventAdv) {
            ventAdv.textContent = a.peak_co2 > 1000 
                ? 'Recommendation: Engage fresh air damper / pulse window opening for 10 minutes.' 
                : 'Optimal Indoor Environmental Condition Maintained.';
        }
    },

    updateLegend() {
        const legTitle = document.getElementById('cfdLegTitle');
        const legMin = document.getElementById('cfdLegMin');
        const legMax = document.getElementById('cfdLegMax');
        const legGrad = document.getElementById('cfdLegGrad');

        if (this.currentMode === 'temp') {
            if (legTitle) legTitle.textContent = 'Temperature Gradient:';
            if (legMin) legMin.textContent = 'Cool Floor: 21.0 °C';
            if (legMax) legMax.textContent = 'Warm Ceiling: 27.5 °C';
            if (legGrad) legGrad.style.background = 'linear-gradient(90deg, #1e3a8a, #0284c7, #10b981, #f59e0b, #ef4444)';
        } else if (this.currentMode === 'co2') {
            if (legTitle) legTitle.textContent = 'Exhaled CO₂ Concentration:';
            if (legMin) legMin.textContent = 'Fresh Base: 400 ppm';
            if (legMax) legMax.textContent = 'Occupant Peak: 1,400+ ppm';
            if (legGrad) legGrad.style.background = 'linear-gradient(90deg, #10b981, #84cc16, #eab308, #f97316, #ef4444, #7f1d1d)';
        } else if (this.currentMode === 'pm25') {
            if (legTitle) legTitle.textContent = 'PM2.5 Particulate Field:';
            if (legMin) legMin.textContent = 'Filtered: 40 µg/m³';
            if (legMax) legMax.textContent = 'Infiltration: 180 µg/m³';
            if (legGrad) legGrad.style.background = 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc, #f43f5e)';
        } else if (this.currentMode === 'velocity') {
            if (legTitle) legTitle.textContent = 'Airflow Velocity (CFD):';
            if (legMin) legMin.textContent = 'Draft: 0.05 m/s';
            if (legMax) legMax.textContent = 'AC Discharge: 2.40 m/s';
            if (legGrad) legGrad.style.background = 'linear-gradient(90deg, #0f172a, #0369a1, #06b6d4, #10b981, #fbbf24, #ef4444)';
        } else {
            if (legTitle) legTitle.textContent = 'Floorplan Architecture:';
            if (legMin) legMin.textContent = 'Classroom BC6007';
            if (legMax) legMax.textContent = '10-Node Sensor Mesh';
            if (legGrad) legGrad.style.background = 'linear-gradient(90deg, #334155, #64748b)';
        }
    },

    // -------------------------------------------------------------------------
    // True 2D Continuous Scalar Heat Map (Inverse Distance Weighting)
    // -------------------------------------------------------------------------
    renderScalarHeatmap(w, h) {
        if (!this.showHeatmap || this.currentMode === 'overview' || !this.nodesData.length) return;

        const offW = this.gridW;
        const offH = this.gridH;
        const imgData = this.offCtx.createImageData(offW, offH);
        const buf = imgData.data;

        // Extract normalized coordinates and values
        const pts = this.nodesData.map(n => {
            let val = 0;
            if (this.currentMode === 'temp') val = n.air_temperature;
            else if (this.currentMode === 'co2') val = n.CO2;
            else if (this.currentMode === 'pm25') val = n.pm2_5;
            else if (this.currentMode === 'velocity') {
                // Approximate velocity field: higher near AC 1 (Node 5) and AC 2 (Node 7)
                val = (n.deviceId === 5 || n.deviceId === 7) ? 2.2 : (n.deviceId === 10 ? 0.9 : 0.25);
            }
            return {
                x: n.position_pct.x / 100.0,
                y: n.position_pct.y / 100.0,
                val: val
            };
        });

        // Determine dynamic range
        let minV = 1e9, maxV = -1e9;
        pts.forEach(p => {
            if (p.val < minV) minV = p.val;
            if (p.val > maxV) maxV = p.val;
        });

        if (this.currentMode === 'temp') {
            minV = Math.min(minV, 21.0);
            maxV = Math.max(maxV, 27.5);
        } else if (this.currentMode === 'co2') {
            minV = Math.min(minV, 420.0);
            maxV = Math.max(maxV, 1200.0);
        } else if (this.currentMode === 'pm25') {
            minV = Math.min(minV, 50.0);
            maxV = Math.max(maxV, 180.0);
        } else if (this.currentMode === 'velocity') {
            minV = 0.05; maxV = 2.4;
        }

        const span = Math.max(0.001, maxV - minV);

        // IDW Interpolation on offscreen grid
        let idx = 0;
        for (let gy = 0; gy < offH; gy++) {
            const ny = gy / (offH - 1);
            for (let gx = 0; gx < offW; gx++) {
                const nx = gx / (offW - 1);

                let num = 0, den = 0;
                for (let i = 0; i < pts.length; i++) {
                    const dx = nx - pts[i].x;
                    const dy = ny - pts[i].y;
                    const d2 = dx * dx + dy * dy + 0.003; // Smooth kernel
                    const w_i = 1.0 / (d2 * d2); // p = 2
                    num += w_i * pts[i].val;
                    den += w_i;
                }

                const interVal = num / den;
                const norm = Math.max(0, Math.min(1, (interVal - minV) / span));

                // Get RGB color from colormap
                const rgb = this.getColor(norm, this.currentMode);

                buf[idx]     = rgb[0];
                buf[idx + 1] = rgb[1];
                buf[idx + 2] = rgb[2];
                buf[idx + 3] = 160; // 63% opacity for rich glass blending
                idx += 4;
            }
        }

        this.offCtx.putImageData(imgData, 0, 0);

        // Draw offscreen smooth buffer to main canvas
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.drawImage(this.offCanvas, 0, 0, w, h);
        this.ctx.restore();
    },

    getColor(t, mode) {
        // High-precision scientific colormap
        if (mode === 'temp') {
            // Turbo / Thermal: Deep Blue -> Cyan -> Green -> Amber -> Crimson
            if (t < 0.25) {
                const s = t / 0.25;
                return [Math.round(30 + s * 10), Math.round(58 + s * 120), Math.round(180 + s * 40)];
            } else if (t < 0.5) {
                const s = (t - 0.25) / 0.25;
                return [Math.round(40 + s * 20), Math.round(178 + s * 40), Math.round(220 - s * 130)];
            } else if (t < 0.75) {
                const s = (t - 0.5) / 0.25;
                return [Math.round(60 + s * 185), Math.round(218 - s * 30), Math.round(90 - s * 80)];
            } else {
                const s = (t - 0.75) / 0.25;
                return [Math.round(245 - s * 15), Math.round(188 - s * 130), Math.round(10 + s * 30)];
            }
        } else if (mode === 'co2') {
            // IAQ: Emerald -> Yellow -> Orange -> Red -> Dark Maroon
            if (t < 0.3) {
                const s = t / 0.3;
                return [Math.round(16 + s * 130), Math.round(185 - s * 10), Math.round(129 - s * 110)];
            } else if (t < 0.6) {
                const s = (t - 0.3) / 0.3;
                return [Math.round(146 + s * 95), Math.round(175 - s * 40), Math.round(19 - s * 5)];
            } else {
                const s = (t - 0.6) / 0.4;
                return [Math.round(241 - s * 80), Math.round(135 - s * 100), Math.round(14 + s * 10)];
            }
        } else if (mode === 'pm25') {
            // Particulate: Light Cyan -> Indigo -> Purple -> Rose
            return [
                Math.round(56 + t * 190),
                Math.round(189 - t * 125),
                Math.round(248 - t * 150)
            ];
        } else {
            // Velocity: Dark Slate -> Sky Blue -> Cyan -> Emerald -> Yellow -> Crimson
            if (t < 0.35) {
                const s = t / 0.35;
                return [Math.round(15 + s * 15), Math.round(30 + s * 130), Math.round(80 + s * 140)];
            } else if (t < 0.7) {
                const s = (t - 0.35) / 0.35;
                return [Math.round(30 + s * 190), Math.round(160 + s * 40), Math.round(220 - s * 180)];
            } else {
                const s = (t - 0.7) / 0.3;
                return [Math.round(220 + s * 25), Math.round(200 - s * 150), Math.round(40)];
            }
        }
    },

    // -------------------------------------------------------------------------
    // Isobar Contour Lines (Fluent-style Isotherms)
    // -------------------------------------------------------------------------
    renderIsobarLines(w, h) {
        if (!this.showIsobars || this.currentMode === 'overview') return;

        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);

        // Draw multiple curved isobar waves across the classroom
        const steps = 6;
        for (let i = 1; i < steps; i++) {
            const frac = i / steps;
            ctx.beginPath();
            ctx.moveTo(10, h * frac);
            ctx.bezierCurveTo(
                w * 0.25, h * (frac - 0.08),
                w * 0.75, h * (frac + 0.08),
                w - 10, h * frac
            );
            ctx.stroke();
        }

        ctx.restore();
    },

    // -------------------------------------------------------------------------
    // Airflow Velocity Vector Streamlines (Split AC Supply Jets)
    // -------------------------------------------------------------------------
    renderAirflowStreamlines(w, h) {
        if (!this.showParticles || (this.currentMode !== 'velocity' && this.currentMode !== 'temp')) return;

        const ctx = this.ctx;
        this.particles.forEach(p => {
            // Update particle position
            p.x += p.vx;
            p.y += p.vy;
            p.life++;

            // Recirculation loop: when reaching East boundary or lifetime ends, disperse and reset to North AC
            if (p.x > 0.90 || p.y < 0.08 || p.y > 0.92 || p.life > p.maxLife) {
                p.x = 0.05 + Math.random() * 0.04;
                p.y = 0.36 + Math.random() * 0.16;
                p.vx = 0.003 + Math.random() * 0.005;
                p.vy = (Math.random() - 0.5) * 0.0018;
                p.life = 0;
            }

            const px = p.x * w;
            const py = p.y * h;

            ctx.beginPath();
            ctx.arc(px, py, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    },

    startLoop() {
        const loop = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(loop);
        };
        this.animationFrame = requestAnimationFrame(loop);
    },

    render() {
        if (!this.canvas || !this.ctx) return;
        if (this.canvas.width < 10 || this.canvas.height < 10) {
            this.resizeCanvas();
        }
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w < 10 || h < 10) return;

        this.ctx.clearRect(0, 0, w, h);

        // 1. Draw Continuous 2D Heatmap
        this.renderScalarHeatmap(w, h);

        // 2. Draw Isobar Contour Lines
        this.renderIsobarLines(w, h);

        // 3. Draw Airflow Streamlines
        this.renderAirflowStreamlines(w, h);
    },

    // -------------------------------------------------------------------------
    // ANSYS Fluent 3D Slice Simulation Renderer (Plane 1xz at y = 3.50m)
    // Dynamic SVG assimilation with room outlet vent and scientific colormaps
    // -------------------------------------------------------------------------
    render3DSlice() {
        const svg = document.getElementById('ansysSliceSvg');
        if (!svg) return;

        // 1. Read live data values for dynamic legend and simulation state
        let minVal = 0, maxVal = 100;
        let unit = '';
        let titleMode = '';
        let scaleTag = '';
        let legTitle = '';
        let rampGradientCss = '';
        let stops = [];
        let plumeStops = [];
        let polyStroke = '#10b981';
        let outletColor = '#0284c7';

        const nodes = this.nodesData || [];

        if (this.currentMode === 'temp') {
            unit = '°C';
            const temps = nodes.map(n => n.air_temperature).filter(v => v !== undefined);
            minVal = temps.length ? Math.min(...temps) : 21.4;
            maxVal = temps.length ? Math.max(...temps) : 26.8;
            titleMode = 'a) Temperature Distribution &bull; Plane 1xz (ANSYS Fluent RANS k-ω SST)';
            scaleTag = 'Thermal Stratification: AC Cold Jet pooling (Floor) vs Buoyant Plumes (Ceiling)';
            legTitle = 'Temperature<br><small>(°C) Plane 1xz</small>';
            rampGradientCss = 'linear-gradient(180deg, #dc2626 0%, #f97316 25%, #eab308 50%, #06b6d4 75%, #1e40af 100%)';
            stops = [
                { offset: '0%', color: '#1e40af', opacity: '0.88' },
                { offset: '30%', color: '#06b6d4', opacity: '0.85' },
                { offset: '55%', color: '#10b981', opacity: '0.85' },
                { offset: '78%', color: '#f97316', opacity: '0.88' },
                { offset: '100%', color: '#dc2626', opacity: '0.92' }
            ];
            plumeStops = [
                { offset: '0%', color: '#ef4444', opacity: '0.95' },
                { offset: '50%', color: '#f59e0b', opacity: '0.75' },
                { offset: '100%', color: '#10b981', opacity: '0.0' }
            ];
            polyStroke = '#f59e0b';
            outletColor = '#0284c7';
        } else if (this.currentMode === 'co2') {
            unit = 'kg/kg';
            const co2s = nodes.map(n => n.CO2).filter(v => v !== undefined);
            const minCo2 = co2s.length ? Math.min(...co2s) : 410;
            const maxCo2 = co2s.length ? Math.max(...co2s) : 1380;
            minVal = minCo2 * 1.519e-6;
            maxVal = maxCo2 * 1.519e-6;
            titleMode = 'c) CO₂ Mass Fraction &bull; Plane 1xz (ANSYS Fluent RANS k-ω SST)';
            scaleTag = 'Real-Time Exhaled Occupant Plume Dispersion & Vertical Stratification';
            legTitle = 'Co2.Mass Fraction<br><small>Plane 1xz</small>';
            rampGradientCss = 'linear-gradient(180deg, #b91c1c 0%, #ea580c 25%, #facc15 50%, #22c55e 75%, #2563eb 100%)';
            stops = [
                { offset: '0%', color: '#0284c7', opacity: '0.75' },
                { offset: '45%', color: '#10b981', opacity: '0.75' },
                { offset: '70%', color: '#eab308', opacity: '0.85' },
                { offset: '100%', color: '#ef4444', opacity: '0.90' }
            ];
            plumeStops = [
                { offset: '0%', color: '#ef4444', opacity: '0.95' },
                { offset: '50%', color: '#f59e0b', opacity: '0.80' },
                { offset: '100%', color: '#10b981', opacity: '0.0' }
            ];
            polyStroke = '#10b981';
            outletColor = '#eab308';
        } else if (this.currentMode === 'pm25') {
            unit = 'µg/m³';
            const pms = nodes.map(n => n.pm2_5).filter(v => v !== undefined);
            minVal = pms.length ? Math.min(...pms) : 38;
            maxVal = pms.length ? Math.max(...pms) : 142;
            titleMode = 'b) PM2.5 Concentration &bull; Plane 1xz (Eulerian DPM Dispersion)';
            scaleTag = 'Perimeter Infiltration vs AC Filtration Recirculation Boundary';
            legTitle = 'PM2.5 Conc.<br><small>(µg/m³) Plane 1xz</small>';
            rampGradientCss = 'linear-gradient(180deg, #7c3aed 0%, #ef4444 25%, #f59e0b 50%, #10b981 75%, #0284c7 100%)';
            stops = [
                { offset: '0%', color: '#0284c7', opacity: '0.85' },
                { offset: '35%', color: '#10b981', opacity: '0.85' },
                { offset: '65%', color: '#f59e0b', opacity: '0.88' },
                { offset: '85%', color: '#ef4444', opacity: '0.90' },
                { offset: '100%', color: '#7c3aed', opacity: '0.92' }
            ];
            plumeStops = [
                { offset: '0%', color: '#7c3aed', opacity: '0.85' },
                { offset: '60%', color: '#f59e0b', opacity: '0.45' },
                { offset: '100%', color: '#0284c7', opacity: '0.0' }
            ];
            polyStroke = '#ef4444';
            outletColor = '#10b981';
        } else { // velocity
            unit = 'm/s';
            minVal = 0.04;
            maxVal = 2.15;
            titleMode = 'd) Velocity Magnitude Vectors &bull; Plane 1xz (k-ω SST Turbulence)';
            scaleTag = 'Split AC Jet Entrainment, Ceiling Throw & Recirculation Vortices';
            legTitle = 'Velocity Mag.<br><small>(m/s) Plane 1xz</small>';
            rampGradientCss = 'linear-gradient(180deg, #dc2626 0%, #f97316 25%, #eab308 50%, #06b6d4 75%, #1e3a8a 100%)';
            stops = [
                { offset: '0%', color: '#1e3a8a', opacity: '0.82' },
                { offset: '40%', color: '#06b6d4', opacity: '0.85' },
                { offset: '70%', color: '#eab308', opacity: '0.88' },
                { offset: '100%', color: '#dc2626', opacity: '0.92' }
            ];
            plumeStops = [
                { offset: '0%', color: '#38bdf8', opacity: '0.85' },
                { offset: '60%', color: '#0284c7', opacity: '0.40' },
                { offset: '100%', color: '#1e3a8a', opacity: '0.0' }
            ];
            polyStroke = '#38bdf8';
            outletColor = '#06b6d4';
        }

        // 2. Update DOM Legend & Headers
        const elTitle = document.getElementById('cfd3DTitle');
        const elScale = document.getElementById('cfd3DScaleTag');
        const elLegTitle = document.getElementById('ansysLegTitle');
        const elRamp = document.getElementById('ansysGradientRamp');
        if (elTitle) elTitle.innerHTML = titleMode;
        if (elScale) elScale.textContent = scaleTag;
        if (elLegTitle) elLegTitle.innerHTML = legTitle;
        if (elRamp) elRamp.style.background = rampGradientCss;

        // 5 graduated scale labels (from Max at top L5 to Min at bottom L1)
        for (let i = 1; i <= 5; i++) {
            const el = document.getElementById(`ansysLegL${i}`);
            if (el) {
                const frac = (i - 1) / 4.0;
                const v = minVal + frac * (maxVal - minVal);
                if (this.currentMode === 'co2') {
                    el.textContent = v.toExponential(3);
                } else if (this.currentMode === 'temp' || this.currentMode === 'velocity') {
                    el.textContent = `${v.toFixed(2)} ${unit}`;
                } else {
                    el.textContent = `${Math.round(v)} ${unit}`;
                }
            }
        }

        // 3. Update SVG LinearGradient (#sliceBaseGrad)
        const baseGrad = document.getElementById('sliceBaseGrad');
        if (baseGrad) {
            baseGrad.innerHTML = stops
                .map(s => `<stop offset="${s.offset}" stop-color="${s.color}" stop-opacity="${s.opacity}"/>`)
                .join('');
        }

        // 4. Update SVG RadialGradient (#plumeGlow) for Occupant Plumes
        const plumeGlow = document.getElementById('plumeGlow');
        if (plumeGlow) {
            plumeGlow.innerHTML = plumeStops
                .map(s => `<stop offset="${s.offset}" stop-color="${s.color}" stop-opacity="${s.opacity}"/>`)
                .join('');
        }

        // 5. Update Cut-Plane Polygon Stroke & Room Outlet Vent Color
        const poly = document.getElementById('ansysSlicePoly');
        if (poly) poly.setAttribute('stroke', polyStroke);

        const outlet = document.getElementById('ansysDoorOutlet');
        if (outlet) outlet.setAttribute('fill', outletColor);
    }
};

window.ClassroomTwin = ClassroomTwin;
document.addEventListener('DOMContentLoaded', () => ClassroomTwin.init());
