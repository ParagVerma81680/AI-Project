"""
Route planning router.

Endpoints:
  POST /api/routes/plan         — plan shopping route for a list of products
  GET  /api/routes/map          — return the full store graph (nodes + edges)
  GET  /api/routes/shortest     — shortest path between any two nodes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session  import get_db
from app.schemas.route     import RouteRequest, RouteResponse
from app.services          import route_service
from app.utils.graph       import STORE_GRAPH, NODE_METADATA
from app.utils.pathfinding import dijkstra

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/routes/plan  — main endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/plan",
    response_model=RouteResponse,
    summary="Plan a shopping route",
    description=(
        "Accepts a list of product IDs (the shopping cart) and returns "
        "the optimal walking route through the store — ordered stops, "
        "step-by-step navigation segments, and which products to pick up "
        "at each aisle. Uses Dijkstra's algorithm + nearest-neighbour heuristic."
    ),
)
def plan_route(request: RouteRequest, db: Session = Depends(get_db)):
    if not STORE_GRAPH.has_node(request.start):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Start node '{request.start}' does not exist in the store map.",
        )
    if not STORE_GRAPH.has_node(request.end):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"End node '{request.end}' does not exist in the store map.",
        )

    return route_service.plan_route(
        db,
        product_ids=request.product_ids,
        start=request.start,
        end=request.end,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/routes/map  — return the full store graph structure
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/map",
    summary="Get store map",
    description="Returns all nodes and edges of the store graph. Useful for rendering the store layout on the frontend.",
)
def get_store_map():
    nodes = []
    for node_id in STORE_GRAPH.nodes:
        meta = NODE_METADATA.get(node_id, {})
        nodes.append({
            "id":    node_id,
            "label": meta.get("label", node_id),
            "x":     meta.get("x", 0),
            "y":     meta.get("y", 0),
        })

    edges = []
    seen = set()
    for node in STORE_GRAPH.nodes:
        for neighbour, weight in STORE_GRAPH.neighbors(node):
            edge_key = tuple(sorted([node, neighbour]))
            if edge_key not in seen:
                seen.add(edge_key)
                edges.append({
                    "from":     node,
                    "to":       neighbour,
                    "distance": weight,
                })

    return {"nodes": nodes, "edges": edges}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/routes/shortest  — raw Dijkstra between two nodes
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/shortest",
    summary="Shortest path between two nodes",
    description="Returns the shortest path and distance between any two nodes in the store graph.",
)
def shortest_path(
    source: str = Query(..., description="Start node, e.g. 'ENTRANCE'"),
    target: str = Query(..., description="End node,   e.g. 'D1'"),
):
    if not STORE_GRAPH.has_node(source):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Node '{source}' not found in store graph.",
        )
    if not STORE_GRAPH.has_node(target):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Node '{target}' not found in store graph.",
        )

    distance, path = dijkstra(STORE_GRAPH, source, target)

    if distance == float("inf"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No path exists between '{source}' and '{target}'.",
        )

    return {
        "source":   source,
        "target":   target,
        "distance": distance,
        "path":     path,
    }
