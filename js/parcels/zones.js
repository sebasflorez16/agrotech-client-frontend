/**
 * Zonas de manejo (precision farming) — UI para el dashboard de parcelas.
 *
 * Depende de:
 *  - Leaflet (window.L)
 *  - Axios (window.axios) o fetch nativo
 *  - getBackendUrl() de /static/js/utils/api-utils.js
 *  - localStorage.accessToken para JWT
 *
 * Engancha el panel #zonesPanel cuando hay una parcela seleccionada
 * (vía wrap de window.updateSelectedParcelBanner).
 */
(function () {
    'use strict';

    const state = {
        currentParcelId: null,
        currentZonification: null,
        map: null,
        layer: null,
    };

    // Colores por índice: NDVI/SAVI = vigor (rojo→verde), NDMI = humedad (seco→húmedo).
    const INDEX_COLORS = {
        ndvi: { low: '#d73027', mid_low: '#fc8d59', mid: '#fee08b', mid_high: '#91cf60', high: '#1a9850' },
        savi: { low: '#d73027', mid_low: '#fc8d59', mid: '#fee08b', mid_high: '#91cf60', high: '#1a9850' },
        ndre: { low: '#ffffcc', mid_low: '#addd8e', mid: '#78c679', mid_high: '#238443', high: '#004529' },
        ndmi: { low: '#a63603', mid_low: '#e6550d', mid: '#fee391', mid_high: '#41b6c4', high: '#08519c' },
    };

    const PRIORITY_COLORS = {
        baja: '#27ae60',
        media: '#f1c40f',
        alta: '#e67e22',
        critica: '#c0392b',
    };

    function colorsFor(indexBase) {
        return INDEX_COLORS[indexBase] || INDEX_COLORS.ndvi;
    }

    function brechaLabel(indexBase) {
        return indexBase === 'ndmi' ? 'brecha de humedad' : 'brecha de vigor';
    }

    const LEGEND_LABELS = {
        ndvi: { low: 'Bajo vigor', mid_low: 'Medio-bajo', mid: 'Medio', mid_high: 'Medio-alto', high: 'Alto vigor' },
        savi: { low: 'Bajo vigor', mid_low: 'Medio-bajo', mid: 'Medio', mid_high: 'Medio-alto', high: 'Alto vigor' },
        ndre: { low: 'Muy bajo', mid_low: 'Bajo', mid: 'Medio', mid_high: 'Alto', high: 'Muy alto' },
        ndmi: { low: 'Muy seco', mid_low: 'Seco', mid: 'Medio', mid_high: 'Húmedo', high: 'Muy húmedo' },
    };

    function renderLegend(indexBase) {
        const el = document.getElementById('zonesLegend');
        if (!el) return;
        const palette = colorsFor(indexBase);
        const labels = LEGEND_LABELS[indexBase] || LEGEND_LABELS.ndvi;
        const order = ['low', 'mid_low', 'mid', 'mid_high', 'high'];
        el.style.display = 'block';
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <span style="font-size:11px;font-weight:700;color:#555;">Leyenda:</span>
                ${order.map(k => `
                    <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#555;">
                        <span style="width:12px;height:12px;border-radius:3px;background:${palette[k]};display:inline-block;border:1px solid rgba(0,0,0,0.15);"></span>${labels[k]}
                    </span>`).join('')}
            </div>`;
    }

    function apiBase() {
        if (typeof getBackendUrl === 'function') {
            return getBackendUrl();
        }
        return `${window.location.protocol}//${window.location.hostname}:8000`;
    }

    function authHeader() {
        const t = localStorage.getItem('accessToken') || localStorage.getItem('access');
        return t ? { Authorization: `Bearer ${t}` } : {};
    }

    async function api(path, opts = {}) {
        const url = `${apiBase()}${path}`;
        const headers = Object.assign(
            { 'Content-Type': 'application/json' },
            authHeader(),
            opts.headers || {}
        );
        const res = await fetch(url, Object.assign({}, opts, { headers }));
        const text = await res.text();
        let data;
        try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
        if (!res.ok) {
            const err = new Error(data?.detail || `HTTP ${res.status}`);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }

    function ensureMap() {
        if (state.map || !window.L) return state.map;
        const el = document.getElementById('zonesMap');
        if (!el) return null;
        const main = window.map;
        const center = (main && typeof main.getCenter === 'function') ? main.getCenter() : [4.6, -74.1];
        const zoom = (main && typeof main.getZoom === 'function') ? main.getZoom() : 12;
        state.map = L.map(el, { zoomControl: true }).setView(center, zoom);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri, Maxar, Earthstar Geographics',
            maxZoom: 19,
        }).addTo(state.map);
        return state.map;
    }

    function centerOnMainMap() {
        if (!state.map || !window.map) return;
        try {
            state.map.setView(window.map.getCenter(), window.map.getZoom(), { animate: false });
            state.map.invalidateSize();
        } catch (_) {}
    }

    function setStatus(html, color) {
        const el = document.getElementById('zonesStatus');
        if (!el) return;
        el.style.color = color || '#666';
        el.innerHTML = html;
    }

    function renderZonesList(zonification) {
        const container = document.getElementById('zonesList');
        if (!container) return;
        const zones = zonification?.zones || [];
        if (!zones.length) {
            container.innerHTML = '<div style="color:#888;font-style:italic;">Sin zonas todavía.</div>';
            const leg = document.getElementById('zonesLegend');
            if (leg) leg.style.display = 'none';
            setExportButtonsEnabled(false);
            return;
        }
        const indexBase = zonification.index_base || 'ndvi';
        const palette = colorsFor(indexBase);
        const field = { ndvi: ['ndvi_mean', 'NDVI'], ndmi: ['ndmi_mean', 'NDMI'], savi: ['savi_mean', 'SAVI'], ndre: ['ndre_mean', 'NDRE'] }[indexBase] || ['ndvi_mean', 'NDVI'];
        const blabel = brechaLabel(indexBase);
        const drainage = zones.find(z => z.drainage_direction)?.drainage_direction;
        let header = '';
        if (drainage) {
            header = `<div style="background:#eaf2f8;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:13px;color:#21618c;">
                💧 Drenaje dominante del lote: hacia el <strong>${drainage}</strong>
            </div>`;
        }
        container.innerHTML = header + zones.map(z => {
            const color = palette[z.category] || '#666';
            const pcolor = PRIORITY_COLORS[z.priority] || '#666';
            const brecha = z.brecha_pct != null ? `${z.brecha_pct >= 0 ? '+' : ''}${z.brecha_pct}%` : '';
            const brechaColor = z.brecha_pct == null ? '#888' : (z.brecha_pct < 0 ? '#c0392b' : '#27ae60');
            const priorityLabel = (z.priority_display || z.priority || 'media').toUpperCase();
            return `
            <div style="border-left:5px solid ${color};background:#fafafa;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong style="color:${color};">${z.label}</strong>
                    <span style="font-size:12px;color:#555;">${(z.area_ha || 0).toFixed(2)} ha · ${z.pixel_count} px</span>
                </div>
                <div style="font-size:12px;color:#444;margin-top:4px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <span>${field[1]} <strong>${z[field[0]] ?? '-'}</strong></span>
                    <span title="Comparación de esta zona vs el promedio del lote">${blabel} <strong style="color:${brechaColor};">${brecha || '-'}</strong></span>
                    <span style="background:${pcolor}22;color:${pcolor};padding:1px 8px;border-radius:10px;font-weight:600;">${priorityLabel}</span>
                </div>
                <div style="font-size:12px;color:#333;margin-top:6px;">${z.recomendacion || ''}</div>
            </div>`;
        }).join('');
        renderLegend(indexBase);
        setExportButtonsEnabled(true);
    }

    function renderZonesOnMap(zonification) {
        const map = ensureMap();
        if (!map) return;
        if (state.layer) {
            map.removeLayer(state.layer);
            state.layer = null;
        }
        const indexBase = zonification.index_base || 'ndvi';
        const palette = colorsFor(indexBase);
        const field = { ndvi: ['ndvi_mean', 'NDVI'], ndmi: ['ndmi_mean', 'NDMI'], savi: ['savi_mean', 'SAVI'], ndre: ['ndre_mean', 'NDRE'] }[indexBase] || ['ndvi_mean', 'NDVI'];
        const blabel = brechaLabel(indexBase);
        const features = (zonification?.zones || [])
            .filter(z => z.geometry_geojson)
            .map(z => ({
                type: 'Feature',
                geometry: z.geometry_geojson,
                properties: {
                    label: z.label,
                    category: z.category,
                    index_label: field[1],
                    index_value: z[field[0]],
                    area_ha: z.area_ha,
                    recomendacion: z.recomendacion,
                    brecha_pct: z.brecha_pct,
                    priority: z.priority,
                    drainage_direction: z.drainage_direction,
                },
            }));
        if (!features.length) return;
        state.layer = L.geoJSON({ type: 'FeatureCollection', features }, {
            style: f => ({
                color: '#222',
                weight: 1,
                fillColor: palette[f.properties.category] || '#888',
                fillOpacity: 0.65,
            }),
            onEachFeature: (f, lyr) => {
                const brecha = f.properties.brecha_pct != null ? `${f.properties.brecha_pct >= 0 ? '+' : ''}${f.properties.brecha_pct}%` : '-';
                const priority = (f.properties.priority || 'media').toUpperCase();
                const drainage = f.properties.drainage_direction;
                lyr.bindPopup(`
                    <strong>${f.properties.label}</strong><br/>
                    ${f.properties.index_label}: ${f.properties.index_value ?? '-'} (${blabel} ${brecha})<br/>
                    Prioridad: ${priority}<br/>
                    ${drainage ? `Drenaje: hacia el ${drainage}<br/>` : ''}
                    Área: ${(f.properties.area_ha || 0).toFixed(2)} ha<br/>
                    <small>${f.properties.recomendacion || ''}</small>
                `);
            },
        }).addTo(state.map);
        try { state.map.fitBounds(state.layer.getBounds(), { padding: [10, 10] }); } catch (_) {}
    }

    async function loadLatestZonification(parcelId) {
        if (!parcelId) return;
        setStatus('Cargando zonificaciones existentes…');
        try {
            const list = await api(`/api/parcels/parcel-zonifications/?parcel=${parcelId}`);
            const items = Array.isArray(list) ? list : (list.results || []);
            if (items.length) {
                const latest = items[0];
                state.currentZonification = latest;
                renderZonesList(latest);
                renderZonesOnMap(latest);
                setStatus(
                    `Última zonificación: imagen del ${latest.scene_date} (la más reciente disponible) · ${latest.method_display || latest.method} · ${latest.k_zones} zonas`
                );
            } else {
                setStatus('No hay zonas aún. Pulsa "Generar zonas".');
                renderZonesList({ zones: [] });
            }
        } catch (e) {
            setStatus(`Error cargando zonificaciones: ${e.message}`, '#c0392b');
        }
    }

    function showZonesSkeleton() {
        const container = document.getElementById('zonesList');
        if (!container) return;
        container.innerHTML = Array.from({ length: 3 }).map(() => `
            <div style="border-radius:8px;padding:12px;margin-bottom:10px;background:#f4f6f8;animation:zonesPulse 1.4s ease-in-out infinite;">
                <div style="height:14px;width:50%;background:#e2e6ea;border-radius:6px;margin-bottom:8px;"></div>
                <div style="height:10px;width:82%;background:#e2e6ea;border-radius:6px;margin-bottom:6px;"></div>
                <div style="height:10px;width:64%;background:#e2e6ea;border-radius:6px;"></div>
            </div>`).join('');
    }

    async function pollZonification(parcelId, zonificationId) {
        for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const list = await api(`/api/parcels/parcel-zonifications/?parcel=${parcelId}`);
                const items = Array.isArray(list) ? list : (list.results || []);
                const z = items.find(x => x.id === zonificationId) || items[0];
                if (!z) continue;
                if (z.status === 'ready') return { ok: true, data: z };
                if (z.status === 'failed') return { ok: false, error: z.notes || 'No se pudo generar la zonificación.' };
            } catch (_) {}
        }
        return { ok: false, error: 'La zonificación tardó demasiado. Inténtalo de nuevo.' };
    }

    function renderZonification(data) {
        state.currentZonification = data;
        renderZonesList(data);
        renderZonesOnMap(data);
        setStatus(
            `✅ Zonificación lista · ${data.zones?.length || 0} zonas · ${data.total_pixels} píxeles · imagen del ${data.scene_date} (la más reciente)`,
            '#27ae60'
        );
    }

    async function generateZonification() {
        const parcelId = state.currentParcelId;
        if (!parcelId) {
            setStatus('Primero selecciona una parcela.', '#c0392b');
            return;
        }
        const k = parseInt(document.getElementById('zonesKSelect').value, 10) || 5;
        const idx = document.getElementById('zonesIndexSelect').value || 'ndvi';
        const btn = document.getElementById('btnGenerateZones');
        if (btn) { btn.disabled = true; btn.textContent = 'Procesando…'; }
        setStatus('<i class="fas fa-spinner fa-spin"></i> Generando zonas… puede tardar hasta 1 minuto.');
        showZonesSkeleton();
        try {
            const data = await api('/api/parcels/parcel-zonifications/generate-for-parcel/', {
                method: 'POST',
                body: JSON.stringify({ parcel: parcelId, k_zones: k, index_base: idx }),
            });
            if (data.status === 'ready') {
                renderZonification(data);
                return;
            }
            setStatus('<i class="fas fa-spinner fa-spin"></i> Procesando en segundo plano… puede tardar hasta 1 minuto.');
            const result = await pollZonification(parcelId, data.id);
            if (result.ok) {
                renderZonification(result.data);
            } else {
                setStatus(`❌ ${result.error}`, '#c0392b');
                renderZonesList({ zones: [] });
            }
        } catch (e) {
            setStatus(`❌ Error: ${e.message}`, '#c0392b');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Generar zonas'; }
        }
    }

    function showPanelFor(parcel) {
        const panel = document.getElementById('zonesPanel');
        if (!panel) return;
        if (!parcel || !parcel.id) {
            panel.style.display = 'none';
            state.currentParcelId = null;
            return;
        }
        panel.style.display = 'block';
        if (parcel.id === state.currentParcelId) return;
        state.currentParcelId = parcel.id;
        // Esperar al próximo frame para que Leaflet calcule tamaños correctos
        setTimeout(() => {
            const m = ensureMap();
            if (m) m.invalidateSize();
            centerOnMainMap();
            loadLatestZonification(parcel.id);
        }, 100);
    }

    function wireBanner() {
        const original = window.updateSelectedParcelBanner;
        window.updateSelectedParcelBanner = function (parcel) {
            try { if (typeof original === 'function') original(parcel); } catch (_) {}
            showPanelFor(parcel);
        };
    }

    function buildFeatureCollection() {
        const zon = state.currentZonification;
        if (!zon || !zon.zones || !zon.zones.length) return null;
        const features = zon.zones.filter(z => z.geometry_geojson).map(z => ({
            type: 'Feature',
            geometry: z.geometry_geojson,
            properties: {
                zona: z.label,
                categoria: z.category,
                area_ha: z.area_ha,
                ndvi: z.ndvi_mean,
                ndmi: z.ndmi_mean,
                brecha_pct: z.brecha_pct,
                prioridad: z.priority,
                recomendacion: z.recomendacion,
            },
        }));
        return { type: 'FeatureCollection', features };
    }

    function downloadFile(filename, content, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function geojsonToKML(fc) {
        const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        let kml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n  <name>Prescripción de zonas de manejo</name>';
        for (const f of fc.features) {
            const p = f.properties || {};
            const name = esc(p.zona || 'Zona');
            const desc = esc(`NDVI ${p.ndvi ?? '-'} · brecha ${p.brecha_pct != null ? p.brecha_pct + '%' : '-'} · prioridad ${p.prioridad || '-'} · ${p.area_ha ?? 0} ha · ${p.recomendacion || ''}`);
            kml += `\n  <Placemark>\n    <name>${name}</name>\n    <description>${desc}</description>`;
            const g = f.geometry;
            const polys = g && g.type === 'Polygon' ? [g.coordinates] : (g && g.type === 'MultiPolygon' ? g.coordinates : []);
            for (const poly of polys) {
                if (!poly || !poly[0]) continue;
                kml += `\n    <Polygon>\n      <outerBoundaryIs>\n        <LinearRing>\n          <coordinates>${poly[0].map(c => `${c[0]},${c[1]},0`).join(' ')}</coordinates>\n        </LinearRing>\n      </outerBoundaryIs>`;
                for (const hole of poly.slice(1)) {
                    kml += `\n      <innerBoundaryIs>\n        <LinearRing>\n          <coordinates>${hole.map(c => `${c[0]},${c[1]},0`).join(' ')}</coordinates>\n        </LinearRing>\n      </innerBoundaryIs>`;
                }
                kml += '\n    </Polygon>';
            }
            kml += '\n  </Placemark>';
        }
        kml += '\n</Document>\n</kml>';
        return kml;
    }

    function exportBaseName() {
        const zon = state.currentZonification;
        const name = (zon && zon.parcel_name) || (window.AGROTECH_STATE && window.AGROTECH_STATE.selectedParcelName) || 'parcela';
        return String(name).replace(/\s+/g, '_');
    }

    function downloadGeoJSON() {
        const fc = buildFeatureCollection();
        if (!fc || !fc.features.length) { setStatus('No hay zonas para exportar. Genera primero la zonificación.', '#c0392b'); return; }
        downloadFile(`prescripcion_${exportBaseName()}.geojson`, JSON.stringify(fc, null, 2), 'application/geo+json');
        setStatus('✅ Prescripción descargada en GeoJSON.', '#27ae60');
    }

    function downloadKML() {
        const fc = buildFeatureCollection();
        if (!fc || !fc.features.length) { setStatus('No hay zonas para exportar. Genera primero la zonificación.', '#c0392b'); return; }
        downloadFile(`prescripcion_${exportBaseName()}.kml`, geojsonToKML(fc), 'application/vnd.google-earth.kml+xml');
        setStatus('✅ Prescripción descargada en KML.', '#27ae60');
    }

    function setExportButtonsEnabled(enabled) {
        const geo = document.getElementById('btnDownloadGeoJSON');
        const kml = document.getElementById('btnDownloadKML');
        if (geo) geo.disabled = !enabled;
        if (kml) kml.disabled = !enabled;
    }

    function init() {
        const btn = document.getElementById('btnGenerateZones');
        if (btn) btn.addEventListener('click', generateZonification);
        window.downloadZonesGeoJSON = downloadGeoJSON;
        window.downloadZonesKML = downloadKML;
        setExportButtonsEnabled(false);
        if (!document.getElementById('zones-skeleton-style')) {
            const st = document.createElement('style');
            st.id = 'zones-skeleton-style';
            st.textContent = '@keyframes zonesPulse{0%,100%{opacity:1}50%{opacity:0.45}}';
            document.head.appendChild(st);
        }
    }

    // Botón "Sectorizar parcela" → abre/cierra el panel de zonas.
    window.toggleZonesPanel = function () {
        const panel = document.getElementById('zonesPanel');
        if (!panel) return;
        const visible = panel.style.display && panel.style.display !== 'none';
        if (visible) {
            panel.style.display = 'none';
            return;
        }
        panel.style.display = 'block';
        const id = window.AGROTECH_STATE && window.AGROTECH_STATE.selectedParcelId;
        if (!id) {
            setStatus('Selecciona primero una parcela en el mapa.', '#c0392b');
            return;
        }
        state.currentParcelId = id;
        setTimeout(() => {
            const m = ensureMap();
            if (m) m.invalidateSize();
            centerOnMainMap();
            loadLatestZonification(id);
        }, 120);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
