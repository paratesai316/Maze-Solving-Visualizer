/* ============================================================
   Real-World Navigation — Map Tab Logic
   Fetches actual road data from OpenStreetMap, runs the selected
   pathfinding algorithm on the real street graph, and animates
   explored edges (yellow) and final path (green) on the map.
   ============================================================ */

(function () {
    'use strict';

    let map = null;
    let startMarker = null;
    let endMarker = null;
    let startLatLng = null;
    let endLatLng = null;
    let clickPhase = 'start';

    // Visualisation layers
    let roadLayer = null;
    let visitedLayer = null;
    let pathLayer = null;
    let animFrameId = null;

    const algoNames = {
        bfs:        'Breadth-First Search',
        dfs:        'Depth-First Search',
        a_star:     'A* Search',
        dijkstra:   "Dijkstra's Algorithm",
        best_first: 'Greedy Best-First Search',
        ucs:        'Uniform Cost Search'
    };

    // ---- Marker icons ----
    function makeIcon(color) {
        return L.divIcon({
            className: '',
            html: `<div style="
                width:28px;height:28px;border-radius:50%;
                background:${color};border:3px solid #fff;
                box-shadow:0 2px 8px rgba(0,0,0,.35);
                display:grid;place-items:center;
            "></div>`,
            iconSize: [28, 28], iconAnchor: [14, 14]
        });
    }
    const startIcon = makeIcon('#60a5fa');
    const endIcon   = makeIcon('#fb7185');

    // ---- Map init ----
    function initMap() {
        if (map) return;
        map = L.map('map-container', {
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true
        }).setView([28.6139, 77.209], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            subdomains: 'abcd', maxZoom: 19
        }).addTo(map);

        window.navMap = map;
        map.on('click', onMapClick);
    }

    // ---- Click handling ----
    function onMapClick(e) {
        if (clickPhase === 'start') { setStart(e.latlng); clickPhase = 'end'; }
        else { setEnd(e.latlng); clickPhase = 'start'; }
    }

    function setStart(ll) {
        startLatLng = ll;
        if (startMarker) map.removeLayer(startMarker);
        startMarker = L.marker(ll, { icon: startIcon, draggable: true, zIndexOffset: 1000 }).addTo(map);
        startMarker.on('dragend', () => { startLatLng = startMarker.getLatLng(); updateDisplay(); });
        const d = document.getElementById('map-start-display');
        d.textContent = `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
        d.classList.add('set');
        updateRouteBtn();
    }

    function setEnd(ll) {
        endLatLng = ll;
        if (endMarker) map.removeLayer(endMarker);
        endMarker = L.marker(ll, { icon: endIcon, draggable: true, zIndexOffset: 1000 }).addTo(map);
        endMarker.on('dragend', () => { endLatLng = endMarker.getLatLng(); updateDisplay(); });
        const d = document.getElementById('map-end-display');
        d.textContent = `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
        d.classList.add('set');
        updateRouteBtn();
    }

    function updateDisplay() {
        if (startLatLng) {
            const d = document.getElementById('map-start-display');
            d.textContent = `${startLatLng.lat.toFixed(5)}, ${startLatLng.lng.toFixed(5)}`;
            d.classList.add('set');
        }
        if (endLatLng) {
            const d = document.getElementById('map-end-display');
            d.textContent = `${endLatLng.lat.toFixed(5)}, ${endLatLng.lng.toFixed(5)}`;
            d.classList.add('set');
        }
        updateRouteBtn();
    }

    function updateRouteBtn() {
        document.getElementById('map-find-route').disabled = !(startLatLng && endLatLng);
    }

    // ---- Layer cleanup ----
    function clearOverlays() {
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        if (roadLayer)    { map.removeLayer(roadLayer);    roadLayer = null; }
        if (visitedLayer) { map.removeLayer(visitedLayer); visitedLayer = null; }
        if (pathLayer)    { map.removeLayer(pathLayer);    pathLayer = null; }
    }

    function clearAll() {
        if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
        if (endMarker)   { map.removeLayer(endMarker);   endMarker = null; }
        clearOverlays();
        startLatLng = null; endLatLng = null;
        clickPhase = 'start';
        document.getElementById('map-start-display').textContent = 'Click on the map';
        document.getElementById('map-start-display').classList.remove('set');
        document.getElementById('map-end-display').textContent = 'Click a second point';
        document.getElementById('map-end-display').classList.remove('set');
        document.getElementById('route-results').classList.add('hidden');
        updateRouteBtn();
    }

    // ---- Draw road network ----
    function drawRoads(segments) {
        // segments = [[[lat1,lon1],[lat2,lon2]], ...]
        const features = segments.map(seg => ({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: seg.map(p => [p[1], p[0]]) // GeoJSON is [lng, lat]
            }
        }));

        roadLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
            style: { color: '#94a3b8', weight: 2, opacity: 0.5 }
        }).addTo(map);
    }

    // ---- Animate exploration then draw path ----
    function animateExploration(visitedEdges, pathCoords, onComplete) {
        visitedLayer = L.layerGroup().addTo(map);
        pathLayer = L.layerGroup().addTo(map);

        const total = visitedEdges.length;
        if (total === 0) { onComplete(); return; }

        // Aim for ~3-4 second animation regardless of edge count
        const stepsPerFrame = Math.max(1, Math.ceil(total / 200));
        let idx = 0;

        function step() {
            const end = Math.min(idx + stepsPerFrame, total);
            for (let i = idx; i < end; i++) {
                const seg = visitedEdges[i];
                // seg = [[lat1,lon1],[lat2,lon2]]
                L.polyline(
                    [L.latLng(seg[0][0], seg[0][1]), L.latLng(seg[1][0], seg[1][1])],
                    { color: '#fbbf24', weight: 3, opacity: 0.7 }
                ).addTo(visitedLayer);
            }
            idx = end;

            if (idx < total) {
                animFrameId = requestAnimationFrame(step);
            } else {
                // Draw final path in green
                if (pathCoords && pathCoords.length > 1) {
                    const latlngs = pathCoords.map(p => L.latLng(p[0], p[1]));
                    L.polyline(latlngs, {
                        color: '#34d399', weight: 5, opacity: 0.95
                    }).addTo(pathLayer);
                }
                animFrameId = null;
                onComplete();
            }
        }
        animFrameId = requestAnimationFrame(step);
    }

    // ---- Main: find route ----
    async function findRoute() {
        if (!startLatLng || !endLatLng) return;

        const btn = document.getElementById('map-find-route');
        btn.disabled = true;
        btn.innerHTML = spinnerSVG + ' Fetching roads...';

        clearOverlays();

        const algoKey = document.getElementById('map-algo').value;

        try {
            const res = await fetch(`${window.location.origin}/map_solve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: [startLatLng.lat, startLatLng.lng],
                    end:   [endLatLng.lat, endLatLng.lng],
                    algorithm: algoKey
                })
            });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
                resetBtn(btn);
                return;
            }

            // 1. Draw the road network faintly
            btn.innerHTML = spinnerSVG + ' Drawing roads...';
            drawRoads(data.road_network);

            // Fit map to road network bounds
            if (roadLayer) map.fitBounds(roadLayer.getBounds().pad(0.05));
            await sleep(200);

            // 2. Animate explored edges
            btn.innerHTML = spinnerSVG + ' Exploring...';
            animateExploration(data.visited_edges, data.path, () => {
                // 3. Show results
                const s = data.stats;
                document.getElementById('route-distance').textContent =
                    s.path_distance_km > 0 ? `${s.path_distance_km} km` : 'No path';
                document.getElementById('route-visited').textContent = `${s.visited_count}`;
                document.getElementById('route-time').textContent = `${s.time}s`;
                document.getElementById('route-algo').textContent = s.algorithm;
                document.getElementById('route-results').classList.remove('hidden');
                resetBtn(btn);
            });
        } catch (err) {
            console.error(err);
            alert('Error computing route. Make sure the Flask server is running and the area has road data.');
            resetBtn(btn);
        }
    }

    // ---- Helpers ----
    const spinnerSVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>';
    const findSVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>';

    function resetBtn(btn) {
        btn.disabled = false;
        btn.innerHTML = findSVG + ' Find Route';
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ---- Wire up buttons ----
    document.getElementById('map-find-route').addEventListener('click', findRoute);
    document.getElementById('map-clear').addEventListener('click', clearAll);

    // ---- Lazy-init ----
    const observer = new MutationObserver(() => {
        const panel = document.getElementById('panel-map');
        if (panel && panel.classList.contains('active')) { initMap(); observer.disconnect(); }
    });
    observer.observe(document.getElementById('panel-map'), { attributes: true, attributeFilter: ['class'] });
    if (document.getElementById('panel-map').classList.contains('active')) initMap();
})();
