from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager
from app.core.logging import logger

router = APIRouter(tags=["Real-Time WebSockets"])

@router.websocket("/ws/inventory")
async def websocket_inventory_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time inventory updates.
    Broadcasts live stock changes whenever an item is purchased, restocked, or cancelled.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)
