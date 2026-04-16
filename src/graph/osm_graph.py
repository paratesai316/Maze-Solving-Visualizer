"""
OSM Road Graph Builder & Pathfinding
Fetches real road data from OpenStreetMap via the Overpass API,
builds a weighted adjacency-list graph, and runs pathfinding algorithms
that track every explored edge for visualization.
"""

import requests
import math
import heapq
import time
import functools
from collections import deque

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

ALGO_NAMES = {
    "bfs":        "Breadth-First Search",
    "dfs":        "Depth-First Search",
    "a_star":     "A* Search",
    "dijkstra":   "Dijkstra's Algorithm",
    "best_first": "Greedy Best-First Search",
    "ucs":        "Uniform Cost Search",
}


# ------------------------------------------------------------------ helpers
def haversine(lat1, lon1, lat2, lon2):
    """Distance in metres between two lat/lon points."""
    R = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# --------------------------------------------------------- OSM data fetch
@functools.lru_cache(maxsize=32)
def fetch_roads(south, west, north, east):
    """Return parsed JSON from the Overpass API for roads in bbox.  Tries multiple mirrors."""
    highway_types = "motorway|trunk|primary|secondary|tertiary|residential|unclassified"
    # Round coordinates to 3 decimal places to increase cache hits for nearby requests (approx 100m buckets)
    south = round(south, 3)
    west = round(west, 3)
    north = round(north, 3)
    east = round(east, 3)

    query = (
        f'[out:json][timeout:25];'
        f'(way["highway"~"^({highway_types})$"]({south},{west},{north},{east}););'
        f'out body qt;>;out skel qt;'
    )

    headers = {
        "User-Agent": "PathViz/1.0 (maze-solving-visualizer; demo app)"
    }

    last_err = None
    for url in OVERPASS_URLS:
        try:
            resp = requests.post(url, data={"data": query}, headers=headers, timeout=25)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_err = e
            continue

    raise RuntimeError(f"All Overpass mirrors failed. Last error: {last_err}")


# ----------------------------------------------------------- graph builder
def build_graph(osm_data):
    """
    Returns
        nodes  – dict {node_id: (lat, lon)}
        adj    – dict {node_id: [(neighbour_id, dist_m), ...]}
        road_segments – list of [[lat,lon],[lat,lon]] pairs (for drawing)
    """
    nodes = {}
    adj = {}
    road_segments = []

    for el in osm_data["elements"]:
        if el["type"] == "node":
            nodes[el["id"]] = (el["lat"], el["lon"])

    for el in osm_data["elements"]:
        if el["type"] != "way":
            continue
        way_nodes = el.get("nodes", [])
        tags = el.get("tags", {})
        oneway = tags.get("oneway", "no") == "yes"

        for i in range(len(way_nodes) - 1):
            n1, n2 = way_nodes[i], way_nodes[i + 1]
            if n1 not in nodes or n2 not in nodes:
                continue

            lat1, lon1 = nodes[n1]
            lat2, lon2 = nodes[n2]
            dist = haversine(lat1, lon1, lat2, lon2)

            adj.setdefault(n1, []).append((n2, dist))
            if not oneway:
                adj.setdefault(n2, []).append((n1, dist))

            road_segments.append([[lat1, lon1], [lat2, lon2]])

    return nodes, adj, road_segments


def nearest_node(nodes, lat, lon):
    """Brute-force nearest graph node. Fine for < 50 k nodes."""
    best, best_d = None, float("inf")
    for nid, (nlat, nlon) in nodes.items():
        d = haversine(lat, lon, nlat, nlon)
        if d < best_d:
            best_d, best = d, nid
    return best


# ------------------------------------------------------------- algorithms
# Each returns (visited_edges, path_coords):
#   visited_edges – list of [[lat1,lon1],[lat2,lon2]]  in exploration order
#   path_coords   – list of [lat,lon]  forming the final path

def _reconstruct(parent, nodes, end):
    path = []
    n = end
    while n is not None:
        path.append(list(nodes[n]))
        n = parent.get(n)
    path.reverse()
    return path


def algo_bfs(adj, nodes, start, end):
    visited_edges = []
    visited = {start}
    parent = {start: None}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        if node == end:
            break
        for nb, _ in adj.get(node, []):
            if nb not in visited:
                visited.add(nb)
                parent[nb] = node
                queue.append(nb)
                visited_edges.append([list(nodes[node]), list(nodes[nb])])

    return visited_edges, _reconstruct(parent, nodes, end) if end in parent else []


def algo_dfs(adj, nodes, start, end):
    visited_edges = []
    visited = {start}
    parent = {start: None}
    stack = [start]

    while stack:
        node = stack.pop()
        if node == end:
            break
        for nb, _ in adj.get(node, []):
            if nb not in visited:
                visited.add(nb)
                parent[nb] = node
                stack.append(nb)
                visited_edges.append([list(nodes[node]), list(nodes[nb])])

    return visited_edges, _reconstruct(parent, nodes, end) if end in parent else []


def algo_dijkstra(adj, nodes, start, end):
    visited_edges = []
    dist = {start: 0}
    parent = {start: None}
    closed = set()
    heap = [(0, start)]

    while heap:
        d, node = heapq.heappop(heap)
        if node in closed:
            continue
        closed.add(node)
        if parent[node] is not None:
            visited_edges.append([list(nodes[parent[node]]), list(nodes[node])])
        if node == end:
            break
        for nb, w in adj.get(node, []):
            if nb not in closed:
                nd = d + w
                if nd < dist.get(nb, float("inf")):
                    dist[nb] = nd
                    parent[nb] = node
                    heapq.heappush(heap, (nd, nb))

    return visited_edges, _reconstruct(parent, nodes, end) if end in parent else []


def algo_a_star(adj, nodes, start, end):
    elat, elon = nodes[end]
    visited_edges = []
    g = {start: 0}
    parent = {start: None}
    closed = set()
    h0 = haversine(*nodes[start], elat, elon)
    heap = [(h0, 0, start)]

    while heap:
        _, gc, node = heapq.heappop(heap)
        if node in closed:
            continue
        closed.add(node)
        if parent[node] is not None:
            visited_edges.append([list(nodes[parent[node]]), list(nodes[node])])
        if node == end:
            break
        for nb, w in adj.get(node, []):
            if nb not in closed:
                ng = gc + w
                if ng < g.get(nb, float("inf")):
                    g[nb] = ng
                    parent[nb] = node
                    h = haversine(*nodes[nb], elat, elon)
                    heapq.heappush(heap, (ng + h, ng, nb))

    return visited_edges, _reconstruct(parent, nodes, end) if end in parent else []


def algo_greedy(adj, nodes, start, end):
    elat, elon = nodes[end]
    visited_edges = []
    parent = {start: None}
    closed = set()
    h0 = haversine(*nodes[start], elat, elon)
    heap = [(h0, start)]

    while heap:
        _, node = heapq.heappop(heap)
        if node in closed:
            continue
        closed.add(node)
        if parent[node] is not None:
            visited_edges.append([list(nodes[parent[node]]), list(nodes[node])])
        if node == end:
            break
        for nb, _ in adj.get(node, []):
            if nb not in closed:
                if nb not in parent:
                    parent[nb] = node
                h = haversine(*nodes[nb], elat, elon)
                heapq.heappush(heap, (h, nb))

    return visited_edges, _reconstruct(parent, nodes, end) if end in parent else []


def algo_ucs(adj, nodes, start, end):
    """Uniform-cost search (equivalent to Dijkstra)."""
    return algo_dijkstra(adj, nodes, start, end)


# ---------------------------------------------------------- public solver
SOLVERS = {
    "bfs": algo_bfs,
    "dfs": algo_dfs,
    "dijkstra": algo_dijkstra,
    "a_star": algo_a_star,
    "best_first": algo_greedy,
    "ucs": algo_ucs,
}


def solve(start_ll, end_ll, algorithm="a_star"):
    """
    Main entry point.
    start_ll / end_ll = [lat, lng]
    Returns dict ready for JSON serialization.
    """
    lat1, lng1 = start_ll
    lat2, lng2 = end_ll

    # Bounding box with extremely tight padding to save resources
    lat_lo, lat_hi = min(lat1, lat2), max(lat1, lat2)
    lng_lo, lng_hi = min(lng1, lng2), max(lng1, lng2)
    lat_pad = max((lat_hi - lat_lo) * 0.10, 0.002)
    lng_pad = max((lng_hi - lng_lo) * 0.10, 0.002)

    south, north = lat_lo - lat_pad, lat_hi + lat_pad
    west, east = lng_lo - lng_pad, lng_hi + lng_pad

    # Cap bbox size to avoid massive downloads (≈4-5 km max span)
    MAX_SPAN = 0.05  
    if (north - south) > MAX_SPAN:
        mid = (north + south) / 2
        north, south = mid + MAX_SPAN / 2, mid - MAX_SPAN / 2
    if (east - west) > MAX_SPAN:
        mid = (east + west) / 2
        east, west = mid + MAX_SPAN / 2, mid - MAX_SPAN / 2

    # Fetch & build
    osm_data = fetch_roads(south, west, north, east)
    nodes, adj, road_segments = build_graph(osm_data)

    if not nodes:
        return {"error": "No road data found in this area."}

    start_id = nearest_node(nodes, lat1, lng1)
    end_id = nearest_node(nodes, lat2, lng2)

    if start_id is None or end_id is None:
        return {"error": "Could not snap to road network."}

    # Solve
    solver = SOLVERS.get(algorithm, algo_bfs)
    t0 = time.perf_counter()
    visited_edges, path_coords = solver(adj, nodes, start_id, end_id)
    elapsed = time.perf_counter() - t0

    # Path distance
    path_dist = 0.0
    for i in range(len(path_coords) - 1):
        path_dist += haversine(
            path_coords[i][0], path_coords[i][1],
            path_coords[i + 1][0], path_coords[i + 1][1],
        )

    return {
        "road_network": road_segments,
        "visited_edges": visited_edges,
        "path": path_coords,
        "start_snap": list(nodes[start_id]),
        "end_snap": list(nodes[end_id]),
        "stats": {
            "visited_count": len(visited_edges),
            "path_length": len(path_coords),
            "path_distance_km": round(path_dist / 1000, 2),
            "time": round(elapsed, 5),
            "algorithm": ALGO_NAMES.get(algorithm, algorithm),
            "total_nodes": len(nodes),
            "total_edges": len(road_segments),
        },
    }
