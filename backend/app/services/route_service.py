"""
Route service — business logic for the shopping route planner.

Steps:
  1. Look up every product_id in the DB.
  2. Group products by aisle.
  3. Run the nearest-neighbour + Dijkstra route planner.
  4. Assemble the RouteResponse with full product and navigation details.
"""

from typing import List

from sqlalchemy.orm import Session

from app.models.product        import Product
from app.schemas.route         import (
    AisleStop, ProductAtStop, RouteResponse, RouteSegment
)
from app.utils.graph           import STORE_GRAPH, get_node_metadata
from app.utils.pathfinding     import plan_shopping_route


def plan_route(
    db: Session,
    product_ids: List[int],
    start: str = "ENTRANCE",
    end:   str = "EXIT",
) -> RouteResponse:
    """
    Given a list of product IDs, return the optimal shopping route.

    Args:
        db:          Database session.
        product_ids: Shopping cart — list of product primary keys.
        start:       Store entry point node name.
        end:         Store exit point node name.

    Returns:
        RouteResponse with navigation segments and per-aisle product lists.
    """

    # ── Step 1: Fetch products from DB ──────────────────────────────────────
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
    )

    found_ids      = {p.id for p in products}
    not_found_ids  = [pid for pid in product_ids if pid not in found_ids]

    # ── Step 2: Group products by aisle ─────────────────────────────────────
    # Products with no aisle assigned go into "not found" for routing purposes
    aisle_map: dict[str, list[Product]] = {}
    unroutable: list[int] = list(not_found_ids)

    for product in products:
        if not product.aisle or not STORE_GRAPH.has_node(product.aisle):
            unroutable.append(product.id)
            continue
        aisle_map.setdefault(product.aisle, []).append(product)

    aisles_to_visit = list(aisle_map.keys())

    # ── Step 3: Run the route planner ───────────────────────────────────────
    raw_route = plan_shopping_route(
        STORE_GRAPH,
        aisles_to_visit,
        start=start,
        end=end,
    )

    # ── Step 4: Build AisleStop list (only real aisle stops, not ENTRANCE/EXIT) ──
    aisle_stops: List[AisleStop] = []
    for stop_node in raw_route["ordered_stops"]:
        if stop_node not in aisle_map:
            continue   # skip ENTRANCE, EXIT, and pass-through nodes
        meta = get_node_metadata(stop_node) or {}
        products_here = aisle_map[stop_node]
        aisle_stops.append(
            AisleStop(
                aisle=stop_node,
                label=meta.get("label", stop_node),
                products=[
                    ProductAtStop(
                        id=p.id,
                        name=p.name,
                        brand=p.brand,
                        price=p.price,
                        shelf=p.shelf,
                    )
                    for p in products_here
                ],
            )
        )

    # ── Step 5: Build RouteSegment list ─────────────────────────────────────
    segments: List[RouteSegment] = [
        RouteSegment(
            from_node=seg["from"],
            to_node=seg["to"],
            distance=seg["distance"],
            path=seg["path"],
        )
        for seg in raw_route["segments"]
    ]

    # ── Step 6: Assemble and return ─────────────────────────────────────────
    return RouteResponse(
        ordered_stops=raw_route["ordered_stops"],
        aisle_stops=aisle_stops,
        segments=segments,
        total_distance=raw_route["total_distance"],
        full_path=raw_route["full_path"],
        products_not_found=unroutable,
    )
