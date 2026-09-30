"""
Store graph — weighted undirected graph representing the store layout.

Nodes  = locations (ENTRANCE, aisles A1-D1, EXIT)
Edges  = corridors with a distance weight (arbitrary "steps" unit)

Store layout (top-down view):

    ENTRANCE
        |
      [ A1 ]──────[ A2 ]
        |                |
      [ B1 ]──────[ B2 ]
        |                |
      [ C1 ]──────[ C2 ]
        |
      [ D1 ]
        |
       EXIT

Usage:
    from app.utils.graph import STORE_GRAPH, get_store_graph

    graph = get_store_graph()
    neighbours = graph.neighbors("A1")
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


# ─────────────────────────────────────────────────────────────────────────────
# Core graph data structure
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Graph:
    """
    Weighted, undirected graph.

    Internally stored as an adjacency list:
        { node: [(neighbour, weight), ...] }
    """
    _adj: Dict[str, List[Tuple[str, float]]] = field(default_factory=dict)

    def add_node(self, node: str) -> None:
        """Register a node (idempotent)."""
        if node not in self._adj:
            self._adj[node] = []

    def add_edge(self, u: str, v: str, weight: float = 1.0) -> None:
        """Add an undirected edge between u and v with the given weight."""
        self.add_node(u)
        self.add_node(v)
        # Avoid duplicate edges
        if not any(n == v for n, _ in self._adj[u]):
            self._adj[u].append((v, weight))
        if not any(n == u for n, _ in self._adj[v]):
            self._adj[v].append((u, weight))

    def neighbors(self, node: str) -> List[Tuple[str, float]]:
        """Return [(neighbour, weight), ...] for the given node."""
        return self._adj.get(node, [])

    @property
    def nodes(self) -> List[str]:
        """All node names in the graph."""
        return list(self._adj.keys())

    def has_node(self, node: str) -> bool:
        return node in self._adj

    def __repr__(self) -> str:
        return f"<Graph nodes={len(self._adj)} edges={sum(len(v) for v in self._adj.values())//2}>"


# ─────────────────────────────────────────────────────────────────────────────
# Store map definition
# ─────────────────────────────────────────────────────────────────────────────

# Node metadata: display name and (col, row) coordinates for frontend rendering
NODE_METADATA: Dict[str, dict] = {
    "ENTRANCE": {"label": "Entrance", "x": 1, "y": 0},
    "A1":       {"label": "Aisle A1 — Dairy",        "x": 0, "y": 1},
    "A2":       {"label": "Aisle A2 — Bakery",        "x": 2, "y": 1},
    "B1":       {"label": "Aisle B1 — Beverages",     "x": 0, "y": 2},
    "B2":       {"label": "Aisle B2 — Snacks",        "x": 2, "y": 2},
    "C1":       {"label": "Aisle C1 — Fruits",        "x": 0, "y": 3},
    "C2":       {"label": "Aisle C2 — Vegetables",    "x": 2, "y": 3},
    "D1":       {"label": "Aisle D1 — Personal Care", "x": 0, "y": 4},
    "EXIT":     {"label": "Exit",                     "x": 1, "y": 5},
}


def build_store_graph() -> Graph:
    """
    Construct and return the store graph.

    Edge weights represent walking distance in "steps" — tune these
    values to match your real store's dimensions.
    """
    g = Graph()

    # ── Main entrance corridor ──────────────────────────────────────────────
    g.add_edge("ENTRANCE", "A1", weight=2)
    g.add_edge("ENTRANCE", "A2", weight=2)

    # ── Row A (top) ─────────────────────────────────────────────────────────
    g.add_edge("A1", "A2", weight=3)   # horizontal cross-aisle

    # ── Column connections (vertical corridors) ─────────────────────────────
    g.add_edge("A1", "B1", weight=4)
    g.add_edge("A2", "B2", weight=4)

    # ── Row B ───────────────────────────────────────────────────────────────
    g.add_edge("B1", "B2", weight=3)

    # ── Column connections ──────────────────────────────────────────────────
    g.add_edge("B1", "C1", weight=4)
    g.add_edge("B2", "C2", weight=4)

    # ── Row C ───────────────────────────────────────────────────────────────
    g.add_edge("C1", "C2", weight=3)

    # ── Column connection ───────────────────────────────────────────────────
    g.add_edge("C1", "D1", weight=4)

    # ── Exit ────────────────────────────────────────────────────────────────
    g.add_edge("D1", "EXIT", weight=2)
    g.add_edge("C2", "EXIT", weight=3)

    return g


# Module-level singleton — import this instead of calling build_store_graph()
STORE_GRAPH: Graph = build_store_graph()


def get_store_graph() -> Graph:
    """Return the shared store graph instance."""
    return STORE_GRAPH


def get_node_metadata(node: str) -> Optional[dict]:
    """Return display metadata for a node, or None if unknown."""
    return NODE_METADATA.get(node)
