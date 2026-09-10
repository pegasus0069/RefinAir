/**
 * RefinAir Satellite Machine Learning Operational Forecasting
 * Real-time Satellite Data Assimilation (NASA Aqua MODIS) & 24-Hour Predictive Trajectory
 */

const MLDashboard = {
    forecastChart: null,

    init() {
        this.fetchForecast();
        // Refresh forecast every 10 seconds in sync with active stream
        setInterval(() => this.fetchForecast(), 10000);
    },

    calculateAqi(pm25) {
        // EPA standard breakpoint calculation for PM2.5
        const c = Math.max(0, pm25);
        let iLow, iHigh, cLow, cHigh, category, color, advisory;

        if (c <= 12.0) {
            cLow = 0.0; cHigh = 12.0; iLow = 0; iHigh = 50;
            category = "Good"; color = "#10b981";
            advisory = "Air quality is satisfactory, and air pollution poses little or no risk.";
        } else if (c <= 35.4) {
            cLow = 12.1; cHigh = 35.4; iLow = 51; iHigh = 100;
            category = "Moderate"; color = "#facc15";
            advisory = "Air quality is acceptable; however, unusually sensitive individuals should consider limiting prolonged outdoor exertion.";
        } else if (c <= 55.4) {
            cLow = 35.5; cHigh = 55.4; iLow = 101; iHigh = 150;
            category = "Unhealthy for Sensitive Groups"; color = "#f97316";
            advisory = "Members of sensitive groups may experience health effects. General public is less likely to be affected.";
        } else if (c <= 150.4) {
            cLow = 55.5; cHigh = 150.4; iLow = 151; iHigh = 200;
            category = "Unhealthy"; color = "#ef4444";
            advisory = "Elevated particulate accumulation observed. Sensitive groups should wear respirators and limit outdoor physical activity.";
        } else if (c <= 250.4) {
            cLow = 150.5; cHigh = 250.4; iLow = 201; iHigh = 300;
            category = "Very Unhealthy"; color = "#a855f7";
            advisory = "Health alert: The risk of health effects is increased for everyone. Avoid strenuous outdoor activity.";
        } else {
            cLow = 250.5; cHigh = 500.4; iLow = 301; iHigh = 500;
            category = "Hazardous"; color = "#881337";
            advisory = "Health warning of emergency conditions: Everyone is more likely to be affected. Remain indoors.";
        }

        const aqi = Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
        return { aqi: Math.min(500, Math.max(0, aqi)), category, color, advisory };
    },

    async fetchForecast() {
        try {
            const res = await fetch('/api/ml/forecast24h');
            if (!res.ok) return;
            const data = await res.json();
            this.renderForecast(data);
        } catch (e) {
            console.error('Failed to fetch ML forecast:', e);
        }
    },

    renderForecast(data) {
        const curPred = data.current_prediction || {};
        const meanPm = curPred.ensemble_mean || 0;
        const ci = curPred.confidence_interval || { low: meanPm * 0.94, high: meanPm * 1.06 };
        const aqiInfo = this.calculateAqi(meanPm);

        // Update Hero Card Values
        const elPm25 = document.getElementById('mlPredPm25Val');
        if (elPm25) elPm25.textContent = meanPm.toFixed(1);

        const elCi = document.getElementById('mlPredCiTag');
        if (elCi) {
            elCi.innerHTML = `<i class="fa-solid fa-check-double text-success"></i> 95% Confidence Interval: [${ci.low} – ${ci.high}] µg/m³`;
        }

        const elAqiNum = document.getElementById('mlPredAqiNum');
        if (elAqiNum) elAqiNum.textContent = aqiInfo.aqi;

        const elAqiStatus = document.getElementById('mlPredAqiStatus');
        if (elAqiStatus) {
            elAqiStatus.textContent = aqiInfo.category;
            elAqiStatus.style.color = aqiInfo.color;
        }

        const elAqiBox = document.getElementById('mlPredAqiBox');
        if (elAqiBox) {
            elAqiBox.style.borderColor = aqiInfo.color;
            elAqiBox.style.boxShadow = `0 0 15px ${aqiInfo.color}33`;
        }

        const elAdv = document.getElementById('mlPredAdvisoryText');
        if (elAdv) elAdv.textContent = aqiInfo.advisory;

        // Update Meteorological Driver Cards
        const drivers = data.meteorological_drivers || {};
        const elAod = document.getElementById('mlDriverAod');
        if (elAod && drivers.aod_550 !== undefined) elAod.textContent = Number(drivers.aod_550).toFixed(2);

        const elVis = document.getElementById('mlDriverVis');
        if (elVis && drivers.visibility !== undefined) elVis.textContent = `${Number(drivers.visibility).toFixed(1)} km`;

        const elRh = document.getElementById('mlDriverRh');
        if (elRh && drivers.relative_humidity !== undefined) elRh.textContent = `${Number(drivers.relative_humidity).toFixed(1)} %`;

        const elWind = document.getElementById('mlDriverWind');
        if (elWind && drivers.wind_speed !== undefined) elWind.textContent = `${Number(drivers.wind_speed).toFixed(1)} mph`;

        // Render 24-Hour Projected Trajectory Line Chart
        if (data.hourly_forecast && data.hourly_forecast.length > 0) {
            this.renderTrajectoryChart(data.hourly_forecast);
        }
    },

    renderTrajectoryChart(forecastData) {
        const canvas = document.getElementById('satelliteForecastChart');
        if (!canvas) return;

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

        const labels = forecastData.map(d => d.hour_label);
        const pmValues = forecastData.map(d => d.pm25);
        const ciHighValues = forecastData.map(d => d.ci_high);
        const ciLowValues = forecastData.map(d => d.ci_low);

        if (this.forecastChart) {
            this.forecastChart.data.labels = labels;
            this.forecastChart.data.datasets[0].data = pmValues;
            this.forecastChart.data.datasets[1].data = ciHighValues;
            this.forecastChart.data.datasets[2].data = ciLowValues;
            this.forecastChart.update('none');
            return;
        }

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        gradient.addColorStop(0.6, 'rgba(99, 102, 241, 0.15)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        this.forecastChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Projected Surface PM2.5 (µg/m³)',
                        data: pmValues,
                        borderColor: '#38bdf8',
                        borderWidth: 2.8,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1.5,
                        order: 1
                    },
                    {
                        label: '95% CI Upper Bound',
                        data: ciHighValues,
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1.2,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: '+1',
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        tension: 0.35,
                        order: 2
                    },
                    {
                        label: '95% CI Lower Bound',
                        data: ciLowValues,
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        borderWidth: 1.2,
                        borderDash: [4, 4],
                        pointRadius: 0,
                        fill: false,
                        tension: 0.35,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', size: 11 },
                            boxWidth: 14,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.92)',
                        titleFont: { family: 'Outfit', size: 12 },
                        bodyFont: { family: 'Inter', size: 11 },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y} µg/m³`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { family: 'Inter', size: 10 },
                            callback: value => `${value} µg/m³`
                        }
                    }
                }
            }
        });
    }
};

window.MLDashboard = MLDashboard;
document.addEventListener('DOMContentLoaded', () => MLDashboard.init());
