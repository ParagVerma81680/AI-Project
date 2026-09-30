"""
Pydantic schemas for the Route Planning resource.

Request:
  RouteRequest  — list of product IDs the customer wants to buy

Response:
  RouteSegment  — one leg of the journey (from → to + path)
  ProductStop   — products to pick up at a specific aisle
  RouteResponse — full route plan returned to the client
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# Request schema
# ─────────────────────────────────────────────────────────────────────────────

class RouteRequest(BaseModel):
    """
    Request body for POST /api/routes/plan.

    The client sends a list of product IDs (the shopping cart).
    The API figures out which aisles they are in and returns the
    optimal walking route.
    """
    product_ids: List[int] = Field(
        ...,
        min_length=1,
        description="List of product IDs in the shopping cart.",
        examples=[[1, 5, 13, 17]],
    )
    start: str = Field(
        "ENTRANCE",
        description="Starting node in the store graph (default: ENTRANCE).",
    )
    end: str = Field(
        "EXIT",
        description="Final destination node (default: EXIT).",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Response schemas
# ─────────────────────────────────────────────────────────────────────────────

class ProductAtStop(BaseModel):
    """Brief product info shown at each aisle stop."""
    id:    int
    name:  str
    brand: Optional[str]
    price: float
    shelf: Optional[str]


class AisleStop(BaseModel):
    """One aisle that the shopper needs to visit."""
    aisle:    str
    label:    str                    # e.g. "Aisle A1 — Dairy"
    products: List[ProductAtStop]    # products to pick up here


class RouteSegment(BaseModel):
    """
    One leg of the journey.
    E.g. walking from ENTRANCE → A1, distance = 2 steps.
    """
    from_node:  str
    to_node:    str
    distance:   float
    path:       List[str]            # intermediate nodes walked through


class RouteResponse(BaseModel):
    """
    Full route plan returned by POST /api/routes/plan.
    """
    ordered_stops:   List[str]          # e.g. ["ENTRANCE","A1","B2","EXIT"]
    aisle_stops:     List[AisleStop]    # stops WITH product details
    segments:        List[RouteSegment] # step-by-step navigation
    total_distance:  float              # sum of all segment distances
    full_path:       List[str]          # every node walked through
    products_not_found: List[int]       # IDs that had no aisle or didn't exist
