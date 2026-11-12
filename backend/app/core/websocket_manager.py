from typing import List, Dict, Any
from fastapi import WebSocket
from app.core.logging import logger

class InventoryWebSocketManager:
    """Manages real-time WebSocket connections to broadcast inventory changes across all customer sessions."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Active listeners: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Active listeners: {len(self.active_connections)}")

    async def broadcast_inventory_update(self, product_id: int, product_name: str, stock: int, is_active: bool = True):
        """Broadcast an inventory stock count update immediately to all connected browsers."""
        payload = {
            "type": "inventory_update",
            "product_id": product_id,
            "product_name": product_name,
            "stock": stock,
            "is_active": is_active and (stock > 0),
            "status": "In Stock" if stock > 10 else ("Low Stock" if stock > 0 else "Out of Stock")
        }
        await self.broadcast(payload)

    async def broadcast_order_created(self, order_number: str, total_amount: float):
        """Broadcast new order notification to listening admin/dashboards."""
        payload = {
            "type": "order_created",
            "order_number": order_number,
            "total_amount": total_amount
        }
        await self.broadcast(payload)

    async def broadcast(self, payload: Dict[str, Any]):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket client: {e}")
                self.disconnect(connection)

ws_manager = InventoryWebSocketManager()
