"""
Pathfinding algorithms for the store graph.

Algorithms implemented:
  1. Dijkstra's shortest-path   — finds the cheapest path between two nodes
  2. Nearest-neighbour heuristic — orders a shopping list of aisles so the
     total walking distance is minimised (greedy approximation of TSP)

Usage:
    from app.utils.pathfinding import dijkstra, plan_shopping_route
    from app.utils.graph import STORE_GRAPH

    dist, path = dijkstra(STORE_GRAPH, "ENTRANCE", "D1")
    result = plan_shopping_route(STORE_GRAPH, ["B2", "A1", "C1"])
"""

from __future__ import annotations

import heapq
from typing import Dict, List, Optional, Tuple

from app.utils.graph import Graph


# ─────────────────────────────────────────────────────────────────────────────
# 1. Dijkstra's Algorithm
# ─────────────────────────────────────────────────────────────────────────────

def dijkstra(
    graph: Graph,
    source: str,
    target: str,
) -> Tuple[float, List[str]]:
    """
    Find the shortest path from `source` to `target` using Dijkstra's algorithm.

    Args:
        graph:  The store graph.
        source: Starting node (e.g. "ENTRANCE").
        target: Destination node (e.g. "D1").

    Returns:
        (total_distance, path)
        path is a list of node names from source → target.
        If no path exists, returns (float('inf'), []).

    Time complexity:  O((V + E) log V)  using a min-heap priority queue.
    """
    if not graph.has_node(source) or not graph.has_node(target):
        return float("inf"), []

    if source == target:
        return 0.0, [source]

    # Priority queue: (distance_so_far, current_node)
    pq: List[Tuple[float, str]] = [(0.0, source)]

    # Best known distance to each node
    distances: Dict[str, float] = {node: float("inf") for node in graph.nodes}
    distances[source] = 0.0

    # Track how we arrived at each node (for path reconstruction)
    previous: Dict[str, Optional[str]] = {node: None for node in graph.nodes}

    visited: set[str] = set()

    while pq:
        current_dist, current_node = heapq.heappop(pq)

        if current_node in visited:
            continue
        visited.add(current_node)

        # Early exit — we reached the target
        if current_node == target:
            break

        for neighbour, weight in graph.neighbors(current_node):
            if neighbour in visited:
                continue
            new_dist = current_dist + weight
            if new_dist < distances[neighbour]:
                distances[neighbour] = new_dist
                previous[neighbour] = current_node
                heapq.heappush(pq, (new_dist, neighbour))

    # Reconstruct the path by tracing back through `previous`
    if distances[target] == float("inf"):
        return float("inf"), []   # target unreachable

    path: List[str] = []
    node: Optional[str] = target
    while node is not None:
        path.append(node)
        node = previous[node]
    path.reverse()

    return distances[target], path


# ─────────────────────────────────────────────────────────────────────────────
# 2. Nearest-Neighbour Heuristic (multi-stop route planner)
# ─────────────────────────────────────────────────────────────────────────────

def plan_shopping_route(
    graph: Graph,
    aisles_to_visit: List[str],
    start: str = "ENTRANCE",
    end: str = "EXIT",
) -> dict:
    """
    Plan an optimal shopping route through a list of aisles using the
    nearest-neighbour heuristic — a fast greedy approximation of TSP.

    Algorithm:
        1. Start at `start` (ENTRANCE).
        2. Repeatedly go to the nearest unvisited aisle.
        3. After all aisles are visited, go to `end` (EXIT).
        4. Use Dijkstra between each consecutive stop to get the real path.

    Args:
        graph:           The store graph.
        aisles_to_visit: List of aisle node names (e.g. ["B2", "A1", "D1"]).
        start:           Starting node (default: "ENTRANCE").
        end:             Final destination (default: "EXIT").

    Returns:
        {
          "ordered_stops": ["ENTRANCE", "A1", "B2", "D1", "EXIT"],
          "segments": [
              {"from": "ENTRANCE", "to": "A1", "distance": 2, "path": [...]},
              ...
          ],
          "total_distance": 18,
          "full_path": ["ENTRANCE", "A1", ..., "EXIT"],
        }
    """
    if not aisles_to_visit:
        return {
            "ordered_stops": [start, end],
            "segments": [],
            "total_distance": 0.0,
            "full_path": [start, end],
        }

    remaining = list(aisles_to_visit)
    ordered_stops = [start]
    current = start

    # Greedy nearest-neighbour ordering
    while remaining:
        best_node  = None
        best_dist  = float("inf")
        best_path: List[str] = []

        for candidate in remaining:
            dist, path = dijkstra(graph, current, candidate)
            if dist < best_dist:
                best_dist = dist
                best_node = candidate
                best_path = path

        if best_node is None:
            break  # unreachable aisle — skip

        ordered_stops.append(best_node)
        remaining.remove(best_node)
        current = best_node

    ordered_stops.append(end)

    # Build full segment details using Dijkstra on the final order
    segments = []
    full_path: List[str] = []
    total_distance = 0.0

    for i in range(len(ordered_stops) - 1):
        frm = ordered_stops[i]
        to  = ordered_stops[i + 1]
        dist, path = dijkstra(graph, frm, to)

        segments.append({
            "from":     frm,
            "to":       to,
            "distance": dist,
            "path":     path,
        })
        total_distance += dist

        # Stitch full path (avoid duplicating shared nodes)
        if full_path:
            full_path.extend(path[1:])
        else:
            full_path.extend(path)

    return {
        "ordered_stops":  ordered_stops,
        "segments":       segments,
        "total_distance": total_distance,
        "full_path":      full_path,
    }
