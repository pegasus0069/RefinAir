/**
 * RefinAir Telemetry & Live Multi-Trace Chart Controller
 */

const TelemetryCharts = {
    chartInstance: null,
    currentMode: 'pm', // 'pm', 'climate', 'gases'
    maxDataPoints: 36,

    labels: [],
    datasets: {
        pm: {
            pm1: [],
            pm25: [],
            pm10: []
        },
        climate: {
            temp: [],
            humidity: []
        },
        gases: {
            co2: [],
            co: []
        }
    },

    async init() {
        this.initButtons();
        await this.loadInitialHistory();
        this.createChart();

        window.addEventListener('refinair:telemetry', (e) => {
            this.appendDataPoint(e.detail);
        });
    },

    initButtons() {
        const btns = document.querySelectorAll('.chart-toggle-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentMode = btn.getAttribute('data-trace');
                this.updateChartMode();
            });
        });
    },

    async loadInitialHistory(deviceId) {
        try {
            const dev = deviceId || (window.App && window.App.activeDeviceId) || 'iub_campus';
            const res = await fetch(`/api/telemetry/history?hours=5&points=30&device=${encodeURIComponent(dev)}`);
            if (!res.ok) return;
            const json = await res.json();
            const hist = json.history || [];

            this.labels = hist.map(h => h.time);
            this.datasets.pm.pm1 = hist.map(h => h.pm1);
            this.datasets.pm.pm25 = hist.map(h => h.pm25);
            this.datasets.pm.pm10 = hist.map(h => h.pm10);

            this.datasets.climate.temp = hist.map(h => h.temperature);
            this.datasets.climate.humidity = hist.map(h => h.humidity);

            this.datasets.gases.co2 = hist.map(h => h.co2);
            this.datasets.gases.co = hist.map(h => h.co);

            if (this.chartInstance) {
                this.chartInstance.data.labels = [...this.labels];
                if (this.currentMode === 'pm') {
                    this.chartInstance.data.datasets[0].data = [...this.datasets.pm.pm25];
                    this.chartInstance.data.datasets[1].data = [...this.datasets.pm.pm1];
                    this.chartInstance.data.datasets[2].data = [...this.datasets.pm.pm10];
                } else if (this.currentMode === 'climate') {
                    this.chartInstance.data.datasets[0].data = [...this.datasets.climate.temp];
                    this.chartInstance.data.datasets[1].data = [...this.datasets.climate.humidity];
                } else if (this.currentMode === 'gases') {
                    this.chartInstance.data.datasets[0].data = [...this.datasets.gases.co2];
                    this.chartInstance.data.datasets[1].data = [...this.datasets.gases.co];
                }
                this.chartInstance.update();
            }
        } catch (e) {
            console.warn('History load fallback:', e);
        }
    },

    setDevice(deviceId) {
        this.loadInitialHistory(deviceId);
    },

    createChart() {
        const ctx = document.getElementById('liveTelemetryChart');
        if (!ctx) return;

        const config = this.getChartConfig();
        this.chartInstance = new Chart(ctx, config);
    },

    getChartConfig() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        let chartDatasets = [];

        if (this.currentMode === 'pm') {
            chartDatasets = [
                {
                    label: 'PM 2.5 (µg/m³)',
                    data: [...this.datasets.pm.pm25],
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 3
                },
                {
                    label: 'PM 1.0 (µg/m³)',
                    data: [...this.datasets.pm.pm1],
                    borderColor: '#818cf8',
                    borderWidth: 1.8,
                    tension: 0.35,
                    fill: false,
                    pointRadius: 2
                },
                {
                    label: 'PM 10 (µg/m³)',
                    data: [...this.datasets.pm.pm10],
                    borderColor: '#f59e0b',
                    borderWidth: 1.8,
                    tension: 0.35,
                    fill: false,
                    pointRadius: 2
                }
            ];
        } else if (this.currentMode === 'climate') {
            chartDatasets = [
                {
                    label: 'Temperature (°C)',
                    data: [...this.datasets.climate.temp],
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Relative Humidity (%)',
                    data: [...this.datasets.climate.humidity],
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    tension: 0.35,
                    fill: true,
                    yAxisID: 'y1'
                }
            ];
        } else if (this.currentMode === 'gases') {
            chartDatasets = [
                {
                    label: 'CO₂ (ppm)',
                    data: [...this.datasets.gases.co2],
                    borderColor: '#eab308',
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'CO (ppm)',
                    data: [...this.datasets.gases.co],
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    tension: 0.35,
                    fill: false,
                    yAxisID: 'y1'
                }
            ];
        }

        const scales = {
            x: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            },
            y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            }
        };

        if (this.currentMode === 'climate' || this.currentMode === 'gases') {
            scales.y1 = {
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
            };
        }

        return {
            type: 'line',
            data: {
                labels: [...this.labels],
                datasets: chartDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { family: 'Outfit', size: 12, weight: '600' },
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { family: 'Outfit', size: 13 },
                        bodyFont: { family: 'Inter', size: 12 }
                    }
                },
                scales: scales
            }
        };
    },

    updateChartMode() {
        if (!this.chartInstance) return;
        this.chartInstance.destroy();
        this.createChart();
    },

    appendDataPoint(data) {
        if (!this.chartInstance) return;
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
        const tel = data.telemetry;

        this.labels.push(timeStr);
        this.datasets.pm.pm1.push(tel.pm1);
        this.datasets.pm.pm25.push(tel.pm25);
        this.datasets.pm.pm10.push(tel.pm10);

        this.datasets.climate.temp.push(tel.temperature);
        this.datasets.climate.humidity.push(tel.humidity);

        this.datasets.gases.co2.push(tel.co2);
        this.datasets.gases.co.push(tel.co);

        if (this.labels.length > this.maxDataPoints) {
            this.labels.shift();
            this.datasets.pm.pm1.shift();
            this.datasets.pm.pm25.shift();
            this.datasets.pm.pm10.shift();
            this.datasets.climate.temp.shift();
            this.datasets.climate.humidity.shift();
            this.datasets.gases.co2.shift();
            this.datasets.gases.co.shift();
        }

        this.chartInstance.data.labels = [...this.labels];
        if (this.currentMode === 'pm') {
            this.chartInstance.data.datasets[0].data = [...this.datasets.pm.pm25];
            this.chartInstance.data.datasets[1].data = [...this.datasets.pm.pm1];
            this.chartInstance.data.datasets[2].data = [...this.datasets.pm.pm10];
        } else if (this.currentMode === 'climate') {
            this.chartInstance.data.datasets[0].data = [...this.datasets.climate.temp];
            this.chartInstance.data.datasets[1].data = [...this.datasets.climate.humidity];
        } else if (this.currentMode === 'gases') {
            this.chartInstance.data.datasets[0].data = [...this.datasets.gases.co2];
            this.chartInstance.data.datasets[1].data = [...this.datasets.gases.co];
        }

        this.chartInstance.update('none');
    }
};

window.TelemetryCharts = TelemetryCharts;
document.addEventListener('DOMContentLoaded', () => TelemetryCharts.init());
