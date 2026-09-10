/**
 * RefinAir Telemetry Data Export Manager
 * Handles multi-node selection, batch CSV streaming, time-range scoping,
 * and authenticated export file generation.
 */

const ExportManager = {
    nodes: [],
    selectedNodeIds: new Set(['iub_campus', 'dhaka_central', 'bashundhara_north', 'gazipur_industrial', 'gulshan_eco']),

    async init() {
        await this.loadNodes();
        this.renderNodeCards();
        this.initControls();
        this.updateSelectionSummary();
    },

    async loadNodes() {
        try {
            const res = await fetch('/api/export/nodes');
            if (res.ok) {
                const json = await res.json();
                this.nodes = json.nodes || [];
            }
        } catch (e) {
            console.warn('Fallback loading export nodes:', e);
        }

        const totalBadge = document.getElementById('totalAvailableNodeCount');
        if (totalBadge && this.nodes.length) {
            totalBadge.textContent = this.nodes.length;
        }
    },

    renderNodeCards() {
        const gridPrimary = document.getElementById('gridPrimaryNodes');
        const gridClassroom = document.getElementById('gridClassroomNodes');
        const gridDivision = document.getElementById('gridDivisionNodes');

        if (gridPrimary) gridPrimary.innerHTML = '';
        if (gridClassroom) gridClassroom.innerHTML = '';
        if (gridDivision) gridDivision.innerHTML = '';

        this.nodes.forEach(node => {
            const card = document.createElement('div');
            const isSelected = this.selectedNodeIds.has(node.id);
            card.className = `export-node-card ${isSelected ? 'selected' : ''}`;
            card.setAttribute('data-node-id', node.id);

            let iconClass = 'fa-tower-cell text-primary';
            if (node.group === 'classroom') iconClass = 'fa-microchip text-warning';
            if (node.group === 'division') iconClass = 'fa-earth-asia text-success';

            card.innerHTML = `
                <div class="card-top-row">
                    <label class="custom-checkbox-wrapper" onclick="event.stopPropagation();">
                        <input type="checkbox" class="node-select-cb" value="${node.id}" ${isSelected ? 'checked' : ''}>
                        <span class="checkbox-checkmark"></span>
                    </label>
                    <div class="node-code-badge"><i class="fa-solid ${iconClass}"></i> ${node.code}</div>
                    <button class="node-instant-dl-btn" title="Download single CSV for ${node.code}" data-node-id="${node.id}">
                        <i class="fa-solid fa-download"></i>
                    </button>
                </div>
                <h4 class="node-title">${node.name}</h4>
                <div class="node-meta-grid">
                    <div class="meta-item"><i class="fa-solid fa-location-dot text-muted"></i> <span>${node.location}</span></div>
                    <div class="meta-item"><i class="fa-solid fa-layer-group text-muted"></i> <span>${node.elevation}</span></div>
                    <div class="meta-item sensor-list"><i class="fa-solid fa-satellite-dish text-muted"></i> <span>${node.sensors}</span></div>
                </div>
            `;

            // Card click toggles selection
            card.addEventListener('click', (e) => {
                if (e.target.closest('.node-instant-dl-btn')) return;
                const cb = card.querySelector('.node-select-cb');
                if (cb && e.target !== cb) {
                    cb.checked = !cb.checked;
                }
                this.toggleNode(node.id, cb.checked);
            });

            // Instant download button click
            const dlBtn = card.querySelector('.node-instant-dl-btn');
            if (dlBtn) {
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.downloadSingleNode(node.id);
                });
            }

            // Checkbox change
            const cb = card.querySelector('.node-select-cb');
            if (cb) {
                cb.addEventListener('change', (e) => {
                    this.toggleNode(node.id, e.target.checked);
                });
            }

            if (node.group === 'primary' && gridPrimary) {
                gridPrimary.appendChild(card);
            } else if (node.group === 'classroom' && gridClassroom) {
                gridClassroom.appendChild(card);
            } else if (node.group === 'division' && gridDivision) {
                gridDivision.appendChild(card);
            }
        });
    },

    toggleNode(nodeId, isChecked) {
        if (isChecked) {
            this.selectedNodeIds.add(nodeId);
        } else {
            this.selectedNodeIds.delete(nodeId);
        }

        const card = document.querySelector(`.export-node-card[data-node-id="${nodeId}"]`);
        if (card) {
            card.classList.toggle('selected', isChecked);
            const cb = card.querySelector('.node-select-cb');
            if (cb) cb.checked = isChecked;
        }

        this.updateSelectionSummary();
    },

    updateSelectionSummary() {
        const count = this.selectedNodeIds.size;
        const badge = document.getElementById('selectedNodesCountBadge');
        if (badge) badge.textContent = count;

        const summary = document.getElementById('exportMetaSummary');
        const rangeSelect = document.getElementById('exportTimeRange');
        const range = rangeSelect ? rangeSelect.value : '5h';

        let recordEstimate = count * 60;
        if (range === '24h') recordEstimate = count * 96;
        if (range === '7d') recordEstimate = count * 168;
        if (range === 'all') recordEstimate = count * 180;

        if (summary) {
            if (count === 0) {
                summary.innerHTML = `<span class="text-warning"><i class="fa-solid fa-triangle-exclamation"></i> Please select at least one node to generate CSV export stream.</span>`;
            } else {
                summary.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Ready to export <strong>${count}</strong> nodes (~<strong>${recordEstimate.toLocaleString()}</strong> observation records) &bull; Standard RFC 4180 CSV format.`;
            }
        }

        const dlBtn = document.getElementById('btnDownloadSelected');
        if (dlBtn) {
            dlBtn.disabled = (count === 0);
            dlBtn.classList.toggle('disabled', count === 0);
        }
    },

    initControls() {
        // Time range change updates summary
        const rangeSelect = document.getElementById('exportTimeRange');
        if (rangeSelect) {
            rangeSelect.addEventListener('change', () => this.updateSelectionSummary());
        }

        // Quick Select: Select All
        const btnAll = document.getElementById('btnSelectAll');
        if (btnAll) {
            btnAll.addEventListener('click', () => {
                this.nodes.forEach(n => this.selectedNodeIds.add(n.id));
                this.syncCheckboxes();
                this.updateSelectionSummary();
            });
        }

        // Quick Select: Deselect All
        const btnNone = document.getElementById('btnDeselectAll');
        if (btnNone) {
            btnNone.addEventListener('click', () => {
                this.selectedNodeIds.clear();
                this.syncCheckboxes();
                this.updateSelectionSummary();
            });
        }

        // Quick Select: Primary Ambient
        const btnPrim = document.getElementById('btnSelectPrimary');
        if (btnPrim) {
            btnPrim.addEventListener('click', () => {
                this.selectedNodeIds.clear();
                this.nodes.filter(n => n.group === 'primary').forEach(n => this.selectedNodeIds.add(n.id));
                this.syncCheckboxes();
                this.updateSelectionSummary();
            });
        }

        // Quick Select: Classroom Mesh
        const btnClass = document.getElementById('btnSelectClassroom');
        if (btnClass) {
            btnClass.addEventListener('click', () => {
                this.selectedNodeIds.clear();
                this.nodes.filter(n => n.group === 'classroom').forEach(n => this.selectedNodeIds.add(n.id));
                this.syncCheckboxes();
                this.updateSelectionSummary();
            });
        }

        // Quick Select: Regional Divisions
        const btnDiv = document.getElementById('btnSelectDivisions');
        if (btnDiv) {
            btnDiv.addEventListener('click', () => {
                this.selectedNodeIds.clear();
                this.nodes.filter(n => n.group === 'division').forEach(n => this.selectedNodeIds.add(n.id));
                this.syncCheckboxes();
                this.updateSelectionSummary();
            });
        }

        // Category Toggle Buttons
        document.querySelectorAll('.cat-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.getAttribute('data-cat');
                const catNodes = this.nodes.filter(n => n.group === cat);
                const allSelected = catNodes.every(n => this.selectedNodeIds.has(n.id));

                catNodes.forEach(n => {
                    if (allSelected) {
                        this.selectedNodeIds.delete(n.id);
                    } else {
                        this.selectedNodeIds.add(n.id);
                    }
                });

                this.syncCheckboxes();
                this.updateSelectionSummary();
            });
        });

        // Main Download Execution Button
        const btnDl = document.getElementById('btnDownloadSelected');
        if (btnDl) {
            btnDl.addEventListener('click', () => this.executeExport());
        }
    },

    syncCheckboxes() {
        document.querySelectorAll('.export-node-card').forEach(card => {
            const nid = card.getAttribute('data-node-id');
            const isSelected = this.selectedNodeIds.has(nid);
            card.classList.toggle('selected', isSelected);
            const cb = card.querySelector('.node-select-cb');
            if (cb) cb.checked = isSelected;
        });
    },

    downloadSingleNode(nodeId) {
        const rangeSelect = document.getElementById('exportTimeRange');
        const range = rangeSelect ? rangeSelect.value : '5h';
        const url = `/api/export/csv?nodes=${encodeURIComponent(nodeId)}&range=${encodeURIComponent(range)}&format=single`;
        this.triggerFileDownload(url);
    },

    executeExport() {
        if (this.selectedNodeIds.size === 0) {
            alert('Please select at least one environmental monitoring station to download CSV data.');
            return;
        }

        const rangeSelect = document.getElementById('exportTimeRange');
        const range = rangeSelect ? rangeSelect.value : '5h';

        const modeSelect = document.getElementById('exportFormatMode');
        const mode = modeSelect ? modeSelect.value : 'combined';

        const selectedList = Array.from(this.selectedNodeIds);

        if (mode === 'combined' || selectedList.length === 1) {
            // Single master CSV containing all selected nodes
            const url = `/api/export/csv?nodes=${encodeURIComponent(selectedList.join(','))}&range=${encodeURIComponent(range)}&format=combined`;
            this.triggerFileDownload(url);
        } else {
            // Multi-node individual batch downloads
            selectedList.forEach((nid, idx) => {
                setTimeout(() => {
                    const url = `/api/export/csv?nodes=${encodeURIComponent(nid)}&range=${encodeURIComponent(range)}&format=single`;
                    this.triggerFileDownload(url);
                }, idx * 450); // Staggered to prevent browser popup block
            });
        }
    },

    triggerFileDownload(url) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 6000);
    }
};

window.ExportManager = ExportManager;
document.addEventListener('DOMContentLoaded', () => ExportManager.init());
