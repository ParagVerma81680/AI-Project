"""
Pydantic schema for the /api/health response.
Schemas define the shape of data coming IN to and going OUT of the API.
"""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Response body returned by GET /api/health."""

    status: str
    project: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "ok",
                    "project": "AI-Based Smart Retail Store Assistant",
                }
            ]
        }
    }
