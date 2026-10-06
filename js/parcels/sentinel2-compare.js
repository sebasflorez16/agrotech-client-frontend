/**
 * sentinel2-compare.js
 * Panel para cargar imágenes Sentinel-2 GRATIS (NDVI/NDMI/SAVI/NDRE) y
 * compararlas sobre el mapa con las de EOSDA.
 *
 * NO modifica parcel.js ni elevation.js. Usa el mismo patrón:
 *   - window.AGROTECH_STATE (parcela seleccionada)
 *   - window.map (mapa Leaflet)
 *   - window.AGROTECH_CONFIG.API_BASE
 *   - localStorage.accessToken
 *
 * Fuente: Sentinel-2 L2A (Planetary Computer) — gratis, 10m.
 */
(function () {
    'use strict';

    const MODULE_TAG = '[S2-COMPARE]';

    let s2Layer = null;
    let s2Visible = false;

    function getBaseUrl() {
        if (window.AGROTECH_CONFIG && window.AGROTECH_CONFIG.API_BASE) {
            return window.AGROTECH_CONFIG.API_BASE + '/api/parcels';
        }
        if (window.ApiUrls && window.ApiUrls.parcels) {
            return window.ApiUrls.parcels();
        }
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocalhost
            ? 'http://localhost:8000/api/parcels'
            : 'https://agrotech-digital-production.up.railway.app/api/parcels';
    }

    function getToken() {
        return localStorage.getItem('accessToken') || '';
    }

    function authFetch(url) {
        // Usa el fetch autenticado del proyecto (auto-refresca el token si expira)
        if (typeof window.authenticatedFetch === 'function') {
            return window.authenticatedFetch(url);
        }
        const headers = getToken() ? { Authorization: `Bearer ${getToken()}` } : {};
        return fetch(url, { headers });
    }

    function selectedParcelId() {
        return window.AGROTECH_STATE && window.AGROTECH_STATE.selectedParcelId;
    }

    function indexBadge(index, val) {
        if (val == null || val === '') return '-';
        const v = Number(val).toFixed(2);
        let color;
        if (index === 'ndmi') {
            color = val >= 0.3 ? '#08306b' : (val >= 0.15 ? '#6baed6' : '#f7fbff');
        } else if (index === 'ndre') {
            color = val >= 0.3 ? '#006837' : (val >= 0.2 ? '#addd8e' : '#f7fcb9');
        } else {
            color = val >= 0.55 ? '#1a9850' : (val >= 0.4 ? '#fee08b' : '#f46d43');
        }
        return `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:9px;height:9px;border-radius:2px;background:${color};display:inline-block;"></span>${v}</span>`;
    }

    function setStatus(html, color) {
        const el = document.getElementById('s2CompareStatus');
        if (!el) return;
        el.style.color = color || '#555';
        el.innerHTML = html;
    }

    async function loadSentinel2(sceneDate = null) {
        const parcelId = selectedParcelId();
        const index = document.getElementById('s2IndexSelect').value;
        const smoothing = document.getElementById('s2SmoothingSelect').value;
        const mode = document.getElementById('s2ModeSelect').value;

        if (!parcelId) {
            setStatus('⚠️ Selecciona primero una parcela.', '#c0392b');
            return;
        }
        if (!window.map) {
            setStatus('⚠️ Mapa no disponible.', '#c0392b');
            return;
        }

        setStatus('<i class="fas fa-tractor fa-spin"></i> Cargando análisis satelital…');
        try {
            let url = `${getBaseUrl()}/parcel/${parcelId}/sentinel2-images/?mode=${mode}&smoothing=${smoothing}&analysis_index=${index}`;
            if (sceneDate) url += `&scene_date=${sceneDate}&exact_date=true`;
            const headers = getToken() ? { Authorization: `Bearer ${getToken()}` } : {};
            const resp = await fetch(url, { headers });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                const err = new Error(data.error || data.message || `HTTP ${resp.status}`);
                err.status = resp.status;
                throw err;
            }

            const b64 = data.images && data.images[index];
            const bounds = data.bounds; // [west, south, east, north]
            if (!b64 || !bounds) throw new Error('Sin imagen o bounds en la respuesta.');

            if (s2Layer) window.map.removeLayer(s2Layer);
            s2Layer = L.imageOverlay(
                `data:image/png;base64,${b64}`,
                [[bounds[1], bounds[0]], [bounds[3], bounds[2]]],
                { opacity: 0.82, interactive: false, className: 's2-layer' }
            ).addTo(window.map);
            s2Visible = true;
            window.map.fitBounds([[bounds[1], bounds[0]], [bounds[3], bounds[2]]]);

            const scene = data.scene || {};
            const stats = data.statistics && data.statistics[index];
            const cloud = scene.cloud_cover != null ? `${Number(scene.cloud_cover).toFixed(1)}%` : '?';
            setStatus(
                `✅ ${index.toUpperCase()} (${smoothing}) · escena ${scene.date || '?'} · nubes ${cloud}` +
                (stats ? ` · mean=${stats.mean}` : ''),
                '#27ae60'
            );
            renderAnalysis(data.analysis);
            console.log(`${MODULE_TAG} Imagen ${index} cargada (${smoothing})`);
        } catch (e) {
            const msg = (e && e.status === 404) || /no se (pudo|encontr)/i.test(String(e && e.message))
                ? 'No hay una imagen limpia para esa fecha (probablemente nublada). Abre "Imágenes disponibles", elige una fecha con 🟢 o 🟠 e inténtalo de nuevo.'
                : 'No se pudo cargar el análisis satelital. Revisa tu conexión e inténtalo de nuevo.';
            setStatus('ℹ️ ' + msg, '#c0392b');
            console.error(`${MODULE_TAG} Error:`, e);
        }
    }

    function clearSentinel2() {
        if (s2Layer && window.map) window.map.removeLayer(s2Layer);
        s2Layer = null;
        s2Visible = false;
        setStatus('Capa Sentinel-2 quitada.', '#888');
    }

    function toggleSentinel2() {
        if (s2Visible && s2Layer && window.map) {
            window.map.removeLayer(s2Layer);
            s2Visible = false;
            setStatus('Capa Sentinel-2 oculta (vuelve a cargar para mostrar).', '#888');
        } else if (s2Layer && window.map) {
            s2Layer.addTo(window.map);
            s2Visible = true;
            setStatus('Capa Sentinel-2 visible.', '#27ae60');
        } else {
            loadSentinel2();
        }
    }

    function injectUI() {
        // Botón en el panel lateral (junto al de elevación)
        const btn = document.createElement('button');
        btn.id = 's2CompareBtn';
        btn.className = 'btn w-100 mt-2';
        btn.style.cssText = 'font-weight:500; background:linear-gradient(135deg,#145A32,#27ae60); border:none; color:white;';
        btn.innerHTML = '<i class="fas fa-satellite-dish me-1"></i> Análisis satelital';
        btn.title = 'Carga los índices de vegetación y humedad de la parcela';
        btn.addEventListener('click', () => {
            const m = document.getElementById('s2CompareModal');
            if (m) new bootstrap.Modal(m).show();
        });

        const elevBtn = document.getElementById('elevacionTerrenoBtn');
        if (elevBtn && elevBtn.parentElement) {
            elevBtn.parentElement.insertBefore(btn, elevBtn);
        }

        // Modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 's2CompareModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content" style="border-radius:16px;background:rgba(255,255,255,0.9);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(255,255,255,0.55);box-shadow:0 20px 60px rgba(0,0,0,0.25);">
                    <div class="modal-header">
                        <h5 class="modal-title">🛰️ Análisis satelital de la parcela</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p style="font-size:12px;color:#888;margin-bottom:12px;">
                            Visualiza los índices de vegetación y humedad de tu parcela
                            sobre el mapa, con análisis de píxeles y recomendaciones.
                        </p>
                        <label class="form-label" style="font-size:13px;">Índice</label>
                        <select id="s2IndexSelect" class="form-select mb-2">
                            <option value="ndvi">NDVI (vigor)</option>
                            <option value="ndmi">NDMI (humedad)</option>
                            <option value="savi">SAVI</option>
                            <option value="ndre">NDRE (nitrógeno)</option>
                        </select>
                        <details class="mb-3" style="background:#f8f9fa;border-radius:10px;padding:10px 12px;">
                            <summary style="cursor:pointer;font-weight:600;color:#555;font-size:13px;">Opciones avanzadas (opcional)</summary>
                            <div style="margin-top:10px;">
                                <label class="form-label" style="font-size:13px;">Modo</label>
                                <select id="s2ModeSelect" class="form-select mb-2">
                                    <option value="contrast" selected>Contraste (percentiles)</option>
                                    <option value="standard">Estándar (escala fija -1..1)</option>
                                </select>
                                <label class="form-label" style="font-size:13px;">Render</label>
                                <select id="s2SmoothingSelect" class="form-select mb-0">
                                    <option value="none">Píxel a píxel</option>
                                    <option value="median" selected>Manchas uniformes (mediana)</option>
                                    <option value="gaussian">Suave (gaussiano)</option>
                                </select>
                            </div>
                        </details>
                        <div id="s2CompareStatus" style="font-size:13px;color:#555;margin-bottom:10px;">
                            Selecciona índice y render, luego "Cargar".
                        </div>
                        <div style="margin-bottom:12px;">
                            <div style="font-size:12px;color:#555;margin-bottom:4px;font-weight:600;">Leyenda</div>
                            <div id="s2LegendBar" style="height:14px;border-radius:7px;background:linear-gradient(to right, #ca0020, #f46d43, #fee08b, #a1d76a, #006d2c);"></div>
                            <div id="s2LegendLabels" style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-top:3px;">
                                <span>Atención</span><span>Bajo</span><span>Intermedio</span><span>Bueno</span><span>Excelente</span>
                            </div>
                        </div>
                        <button class="btn btn-success w-100 mb-2" onclick="window.loadSentinel2Compare()">
                            <i class="fas fa-satellite me-1"></i> Cargar análisis
                        </button>
                        <button class="btn btn-outline-secondary w-100 mb-2" onclick="window.toggleSentinel2Compare()">
                            Mostrar / ocultar capa
                        </button>
                        <button class="btn btn-outline-danger w-100" onclick="window.clearSentinel2Compare()">
                            Quitar capa
                        </button>
                        <div id="s2AnalysisPanel" style="margin-top:14px;display:none;"></div>
                        <div style="border-top:1px solid #eee;padding-top:12px;margin-top:14px;">
                            <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">📅 Imágenes disponibles</div>
                            <div style="font-size:11px;color:#888;margin-bottom:8px;">Elige el rango de fechas para ver las imágenes satelitales disponibles de tu parcela.</div>
                            <div style="display:flex;gap:8px;margin-bottom:8px;">
                                <input type="date" id="s2HistFrom" class="form-control form-control-sm" style="font-size:12px;" title="Desde">
                                <input type="date" id="s2HistTo" class="form-control form-control-sm" style="font-size:12px;" title="Hasta">
                                <button class="btn btn-sm btn-success" onclick="window.loadSentinel2History()">Buscar</button>
                            </div>
                            <div id="s2HistoryPanel" style="font-size:12px;color:#555;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log(`${MODULE_TAG} UI inyectada`);

        // Leyenda dinámica según índice
        const indexSelect = document.getElementById('s2IndexSelect');
        if (indexSelect) {
            indexSelect.addEventListener('change', updateLegend);
            updateLegend();
        }

        // Fechas por defecto del histórico (últimos 180 días)
        const histFrom = document.getElementById('s2HistFrom');
        const histTo = document.getElementById('s2HistTo');
        if (histFrom && histTo) {
            const now = new Date();
            histTo.value = now.toISOString().slice(0, 10);
            histFrom.value = new Date(now.getTime() - 180 * 86400000).toISOString().slice(0, 10);
        }
    }

    function updateLegend() {
        const index = (document.getElementById('s2IndexSelect') && document.getElementById('s2IndexSelect').value) || 'ndvi';
        const bar = document.getElementById('s2LegendBar');
        const labels = document.getElementById('s2LegendLabels');
        if (!bar || !labels) return;
        const scales = {
            ndvi: { css: '#af372d, #f46d43, #fee08b, #a1d76a, #006d2c', labels: ['Atención', 'Bajo', 'Intermedio', 'Bueno', 'Excelente'] },
            savi: { css: '#af372d, #f46d43, #fee08b, #a1d76a, #006d2c', labels: ['Atención', 'Bajo', 'Intermedio', 'Bueno', 'Excelente'] },
            ndmi: { css: '#f7fbff, #c6dbef, #6baed6, #2171b5, #08306b', labels: ['Muy seco', 'Seco', 'Medio', 'Húmedo', 'Muy húmedo'] },
            ndre: { css: '#ffffcc, #addd8e, #78c679, #238443, #004529', labels: ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'] },
        };
        const s = scales[index] || scales.ndvi;
        bar.style.background = `linear-gradient(to right, ${s.css})`;
        labels.innerHTML = s.labels.map(l => `<span>${l}</span>`).join('');
    }

    function renderAnalysis(analysis) {
        const panel = document.getElementById('s2AnalysisPanel');
        if (!panel) return;
        if (!analysis || !analysis.categories) {
            panel.style.display = 'none';
            return;
        }
        const colors = {
            vegetacion_escasa: '#af372d',
            estres_moderado: '#f46d43',
            vigor_bajo: '#fee08b',
            vegetacion_densa: '#a1d76a',
            vegetacion_muy_densa: '#006d2c',
            vigor_optimo: '#004529',
        };
        const catRows = analysis.categories.map(c => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="width:12px;height:12px;border-radius:3px;background:${colors[c.key] || '#ccc'};flex-shrink:0;"></span>
                <span style="flex:1;font-size:13px;color:#333;">${c.label}</span>
                <span style="font-weight:600;font-size:13px;">${c.pct}%</span>
            </div>
        `).join('');
        const alerts = (analysis.alerts || []).map(a => `<div style="color:#c0392b;font-size:12px;margin-bottom:4px;">⚠️ ${a}</div>`).join('');
        const recs = (analysis.recommendations || []).map(r => `<div style="color:#21618c;font-size:12px;margin-bottom:4px;">💡 ${r}</div>`).join('');
        panel.style.display = 'block';
        panel.innerHTML = `
            <div style="border-top:1px solid #eee;padding-top:12px;">
                <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:8px;">📊 Análisis de píxeles (${(analysis.index || '').toUpperCase()})</div>
                <div style="font-size:12px;color:#888;margin-bottom:8px;">Total de píxeles analizados: ${analysis.total_pixels.toLocaleString()} · mean ${analysis.mean}</div>
                ${catRows}
                ${alerts ? `<div style="margin-top:8px;">${alerts}</div>` : ''}
                ${recs ? `<div style="margin-top:4px;">${recs}</div>` : ''}
            </div>
        `;
    }

    async function loadHistory() {
        const parcelId = selectedParcelId();
        const fromEl = document.getElementById('s2HistFrom');
        const toEl = document.getElementById('s2HistTo');
        const panel = document.getElementById('s2HistoryPanel');
        if (!panel) return;
        if (!parcelId) { panel.innerHTML = '⚠️ Selecciona primero una parcela.'; return; }

        let from = fromEl ? fromEl.value : '';
        let to = toEl ? toEl.value : '';
        const now = new Date();
        if (!to) to = now.toISOString().slice(0, 10);
        if (!from) from = new Date(now.getTime() - 180 * 86400000).toISOString().slice(0, 10);

        panel.innerHTML = '🛰️ Buscando imágenes disponibles…';
        try {
            const url = `${getBaseUrl()}/parcel/${parcelId}/sentinel2-scenes/?date_from=${from}&date_to=${to}`;
            const resp = await authFetch(url);
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.error || data.message || `HTTP ${resp.status}`);
            const scenes = data.scenes || [];
            if (!scenes.length) { panel.innerHTML = 'No hay imágenes en el rango de fechas.'; return; }

            const rows = scenes.map(s => {
                const cc = s.cloud_cover;
                let q;
                if (cc == null) q = { label: '—', color: '#ccc', bg: '#f2f2f2' };
                else if (cc <= 15) q = { label: 'Óptima', color: '#1e7b34', bg: '#e6f4ea' };
                else if (cc <= 40) q = { label: 'Buena', color: '#b26a00', bg: '#fdf1dc' };
                else q = { label: 'Nublada', color: '#c0392b', bg: '#fdecea' };
                return `
                <tr>
                    <td>${s.date}</td>
                    <td>
                        <span style="display:inline-flex;align-items:center;gap:6px;">
                            <span style="width:11px;height:11px;border-radius:50%;background:${q.color};display:inline-block;border:1px solid rgba(0,0,0,0.08);"></span>
                            <span style="font-size:11px;background:${q.bg};color:${q.color};border-radius:10px;padding:1px 8px;font-weight:600;">${cc != null ? cc + '%' : '—'} · ${q.label}</span>
                        </span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-success" title="NDVI (vigor)" onclick="window.viewSceneImage('${s.date}', 'ndvi')">NDVI</button>
                            <button class="btn btn-outline-primary" title="NDMI (humedad)" onclick="window.viewSceneImage('${s.date}', 'ndmi')">NDMI</button>
                            <button class="btn btn-outline-warning" title="SAVI" onclick="window.viewSceneImage('${s.date}', 'savi')">SAVI</button>
                        </div>
                    </td>
                </tr>
            `;
            }).join('');

            panel.innerHTML = `
                <div style="font-size:11px;color:#888;margin-bottom:8px;">${scenes.length} imágenes · 🟢 Óptima (&lt;15% nubes) · 🟠 Buena (&lt;40%) · 🔴 Nublada (&gt;40%) · toca un índice para ver la imagen de esa fecha</div>
                <table class="table table-sm table-hover" style="font-size:12px;margin:0;">
                    <thead><tr><th>Fecha</th><th>Nubosidad</th><th>Ver índice</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        } catch (e) {
            panel.innerHTML = '❌ ' + e.message;
        }
    }

    async function loadS2History() {
        const parcelId = selectedParcelId();
        const fromEl = document.getElementById('fechaInicioInput');
        const toEl = document.getElementById('fechaFinInput');
        const panel = document.getElementById('s2HistoryDashboardPanel');
        if (!panel) return;
        if (!parcelId) {
            if (typeof window.showErrorToast === 'function') {
                window.showErrorToast('Selecciona primero una parcela en el mapa.');
            }
            return;
        }

        let from = fromEl ? fromEl.value : '';
        let to = toEl ? toEl.value : '';
        const now = new Date();
        if (!to) to = now.toISOString().slice(0, 10);
        if (!from) from = `${now.getFullYear()}-01-01`;

        panel.style.display = 'block';
        const hint = document.getElementById('s2HistoryHint');
        if (hint) hint.style.display = 'none';
        panel.innerHTML = `
            <div style="text-align:center;padding:16px;">
                <i class="fas fa-tractor fa-spin" style="font-size:30px;color:#2E7D32;"></i>
                <div style="font-size:13px;font-weight:600;color:#333;margin-top:8px;">Analizando la evolución del cultivo…</div>
                <div style="font-size:12px;color:#888;margin-top:6px;">Puede tardar un momento la primera vez.</div>
            </div>
        `;

        let params = 'days_back=366';
        if (from) params += `&date_from=${from}`;
        if (to) params += `&date_to=${to}`;
        try {
            const url = `${getBaseUrl()}/parcel/${parcelId}/sentinel2-history/?${params}`;
            const resp = await authFetch(url);
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(data.error || data.message || `HTTP ${resp.status}`);
            const series = data.series || [];
            if (!series.length) { panel.innerHTML = '<div style="padding:12px;color:#888;">No hay imágenes en el rango de fechas.</div>'; return; }

            let trend = '';
            if (series.length >= 2) {
                const last = series[series.length - 1];
                const prev = series[series.length - 2];
                const diff = (last.ndvi_mean != null && prev.ndvi_mean != null) ? (last.ndvi_mean - prev.ndvi_mean) : null;
                if (diff != null) {
                    if (diff > 0.05) trend = '<span style="font-size:11px;font-weight:700;color:#1e7b34;background:#e6f4ea;border-radius:20px;padding:4px 12px;">📈 Mejorando</span>';
                    else if (diff < -0.05) trend = '<span style="font-size:11px;font-weight:700;color:#c0392b;background:#fdecea;border-radius:20px;padding:4px 12px;">📉 Bajando</span>';
                    else trend = '<span style="font-size:11px;font-weight:700;color:#7f8c8d;background:#eef1f3;border-radius:20px;padding:4px 12px;">➡️ Estable</span>';
                }
            }

            const rows = series.map(p => `
                <tr>
                    <td>${p.date}</td>
                    <td>${p.cloud_cover != null ? p.cloud_cover + '%' : '-'}</td>
                    <td>${indexBadge('ndvi', p.ndvi_mean)}</td>
                    <td>${indexBadge('ndmi', p.ndmi_mean)}</td>
                    <td>${indexBadge('savi', p.savi_mean)}</td>
                </tr>
            `).join('');

            panel.innerHTML = `
                <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.06);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                        <div>
                            <div style="font-weight:700;color:#145A32;font-size:15px;">Evolución de índices de vegetación</div>
                            <div style="font-size:12px;color:#888;margin-top:2px;">Cada punto es el <strong>promedio de todos los píxeles del lote completo</strong> en esa fecha · una imagen limpia por mes, desde enero.</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            ${trend}
                            <span style="font-size:11px;color:#999;background:#f1f3f5;border-radius:20px;padding:4px 10px;">${series.length} imágenes</span>
                        </div>
                    </div>

                    <div style="position:relative;height:340px;margin-bottom:6px;">
                        <canvas id="s2HistoryChart"></canvas>
                    </div>

                    <div style="margin:14px 0 6px;padding:12px;background:#fafbfc;border:1px solid #eef1f4;border-radius:10px;">
                        <div style="font-size:12px;font-weight:700;color:#333;margin-bottom:8px;">📖 ¿Cómo leer la gráfica?</div>
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                            <span style="font-size:11px;color:#c0392b;font-weight:600;">Menos</span>
                            <div style="flex:1;height:14px;border-radius:7px;background:linear-gradient(to right, #ca0020, #fee08b, #006d2c);"></div>
                            <span style="font-size:11px;color:#1e7b34;font-weight:600;">Más</span>
                        </div>
                        <div style="font-size:12px;color:#444;line-height:1.7;">
                            <div><span style="font-weight:700;color:#1a9850;">● Verde (NDVI):</span> qué tan verde y sano está el cultivo.</div>
                            <div><span style="font-weight:700;color:#2171b5;">● Azul (NDMI):</span> cuánta agua tiene la hoja.</div>
                            <div style="color:#888;">El valor va de −1 a +1: mientras más alto, mejor.</div>
                            <div style="color:#888;">Se promedian <strong>todos los píxeles dentro del lote</strong>, por eso es una sola cifra por fecha.</div>
                        </div>
                    </div>

                    <div style="overflow-x:auto;">
                        <table class="table table-sm" style="font-size:12px;margin:0;min-width:420px;">
                            <thead><tr><th>Fecha</th><th>Nubes</th><th>NDVI</th><th>NDMI</th><th>SAVI</th></tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;

            if (typeof Chart !== 'undefined') {
                renderS2HistoryChart(series);
            }
        } catch (e) {
            panel.innerHTML = `<div style="padding:12px;color:#c0392b;">❌ ${e.message}</div>`;
        }
    }

    function formatMes(dateStr) {
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d)) return dateStr;
        return `${meses[d.getMonth()]} ${d.getFullYear()}`;
    }

    function renderS2HistoryChart(series) {
        const canvas = document.getElementById('s2HistoryChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (window._s2HistoryChart) window._s2HistoryChart.destroy();

        const labels = series.map(p => p.date);
        const make = k => series.map(p => p[k + '_mean'] != null ? Number(p[k + '_mean']) : null);

        window._s2HistoryChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'NDVI (vigor)',
                        data: make('ndvi'),
                        borderColor: '#1a9850',
                        backgroundColor: 'rgba(26,152,80,0.14)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: '#1a9850',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1.5,
                        pointHoverRadius: 6,
                        spanGaps: true,
                    },
                    {
                        label: 'NDMI (humedad)',
                        data: make('ndmi'),
                        borderColor: '#2171b5',
                        backgroundColor: 'rgba(33,113,181,0.12)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: '#2171b5',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1.5,
                        pointHoverRadius: 6,
                        spanGaps: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    ...(typeof window.ChartZoom !== 'undefined' || typeof zoomPlugin !== 'undefined' ? {
                        zoom: {
                            zoom: {
                                wheel: { enabled: true, speed: 0.1 },
                                pinch: { enabled: true },
                                mode: 'xy',
                            },
                            pan: { enabled: true, mode: 'xy' },
                        },
                    } : {}),
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: { size: 12, weight: '600' } },
                    },
                    tooltip: {
                        callbacks: {
                            title: items => {
                                const p = series[items[0].dataIndex];
                                return p ? formatMes(p.date) : items[0].label;
                            },
                            label: ctx => {
                                const p = series[ctx.dataIndex];
                                const extra = p && p.cloud_cover != null ? ` · nubes ${p.cloud_cover}%` : '';
                                return `${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(2) : '—'}${extra}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Mes', font: { size: 11, weight: '600' } },
                        ticks: { maxTicksLimit: 8, font: { size: 10 } },
                        grid: { display: false },
                    },
                    y: {
                        title: { display: true, text: 'Valor del índice', font: { size: 11, weight: '600' } },
                        grace: '15%',
                        ticks: { font: { size: 10 } },
                        grid: { color: 'rgba(0,0,0,0.06)' },
                    },
                },
            },
        });
    }

    function viewSceneImage(sceneDate, index) {
        const modal = document.getElementById('s2CompareModal');
        if (modal) new bootstrap.Modal(modal).show();
        if (index) {
            const sel = document.getElementById('s2IndexSelect');
            if (sel) { sel.value = index; updateLegend(); }
        }
        return loadSentinel2(sceneDate);
    }

    window.loadSentinel2Compare = loadSentinel2;
    window.clearSentinel2Compare = clearSentinel2;
    window.toggleSentinel2Compare = toggleSentinel2;
    window.loadSentinel2History = loadHistory;
    window.loadS2History = loadS2History;
    window.viewSceneImage = viewSceneImage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectUI);
    } else {
        injectUI();
    }
})();
