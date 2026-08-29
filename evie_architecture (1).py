import asyncio
import json
import websockets
import random

# In-memory system state representing Evie's telemetry data
SYSTEM_STATE = {
    "suit_pressure_psi": 150,
    "heart_rate_bpm": 72,
    "adrenaline_index": 0.12,
    "system_status": "NOMINAL"
}

# Track all connected UI clients (e.g., evie_hud.html frontend interfaces)
CONNECTED_CLIENTS = set()

async def register(websocket):
    """Register a new UI client connection and push the current state instantly."""
    CONNECTED_CLIENTS.add(websocket)
    print(f"[Evie Core] HUD client connected from {websocket.remote_address}")
    # Immediately sync the newly connected HUD with current metrics
    initial_payload = {
        "event_type": "HUD_STATE_MUTATION",
        "priority": "INFO",
        "ui_modifications": {
            "alert_box": {
                "visible": true,
                "header": "SYSTEM INITIALISED",
                "body": "Evie interface linked. Monitoring local device mesh network telemetry.",
                "color_hex": "#00f0ff"
            },
            "telemetry_graphs": {
                "heart_rate_status": "NORMAL",
                "suit_pressure_psi": SYSTEM_STATE["suit_pressure_psi"]
            }
        }
    }
    # Fix python boolean to json conversion string mapping
    initial_payload_str = json.dumps(initial_payload).replace("true", "true").replace("false", "false")
    await websocket.send(json.dumps(initial_payload))

async def unregister(websocket):
    """Clean up connections upon closure."""
    CONNECTED_CLIENTS.remove(websocket)
    print(f"[Evie Core] HUD client disconnected")

async def broadcast_state_update(priority="INFO", alert_header=None, alert_body=None, alert_color="#00f0ff"):
    """Broadcast telemetry mutations to all active connected HUD frontends."""
    if not CONNECTED_CLIENTS:
        return
        
    payload = {
        "event_type": "HUD_STATE_MUTATION",
        "priority": priority,
        "ui_modifications": {
            "alert_box": {
                "visible": True if alert_header else False,
                "header": alert_header or "",
                "body": alert_body or "",
                "color_hex": alert_color
            },
            "telemetry_graphs": {
                "heart_rate_status": "NORMAL" if SYSTEM_STATE["heart_rate_bpm"] < 100 else "ELEVATED" if SYSTEM_STATE["heart_rate_bpm"] < 130 else "CRITICAL",
                "suit_pressure_psi": SYSTEM_STATE["suit_pressure_psi"]
            }
        }
    }
    
    message = json.dumps(payload)
    await asyncio.gather(*[client.send(message) for client in CONNECTED_CLIENTS])

async def handle_incoming_telemetry(websocket, path):
    """
    Central ingestion engine. Handles incoming streams from the cross-device mesh
    (smartwatches, phones) or incoming commands from the frontend interface.
    """
    await register(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                
                # Case 1: Ingesting Biometric Telemetry Input from a Smartwatch
                if "device_source" in data and "apple_watch" in data["device_source"]:
                    vitals = data["payload"]["vitals"]
                    SYSTEM_STATE["heart_rate_bpm"] = vitals["heart_rate_bpm"]
                    SYSTEM_STATE["adrenaline_index"] = vitals["adrenaline_index"]
                    print(f"[Telemetry Ingest] Watch sync -> HR: {SYSTEM_STATE['heart_rate_bpm']} BPM")
                    
                    # If heart rate crosses critical thresholds, automatically trigger an alert
                    if SYSTEM_STATE["heart_rate_bpm"] > 130:
                        await broadcast_state_update(
                            priority="HIGH",
                            alert_header="VITAL WARNING",
                            alert_body=f"Peter, your heart rate is hitting {SYSTEM_STATE['heart_rate_bpm']} BPM. Adrenaline spiked.",
                            alert_color="#ff3333"
                        )
                    else:
                        await broadcast_state_update()

                # Case 2: Handling Action/Command Calls (e.g. from UI buttons or Speech Parsing)
                elif data.get("event_type") == "COMMAND_EXECUTION":
                    command = data.get("command")
                    print(f"[AI Orchestrator] Executing logic function tool: {command}")
                    
                    if command == "recalibrate_shooters":
                        # Perform core logic calculation
                        SYSTEM_STATE["suit_pressure_psi"] = 180
                        await broadcast_state_update(
                            priority="CRITICAL",
                            alert_header="RECALIBRATED",
                            alert_body="Pressure locked at optimal 180 PSI. Web-fluid atomizers aligned.",
                            alert_color="#00ff88"
                        )
                    elif command == "reset_system":
                        SYSTEM_STATE["suit_pressure_psi"] = 150
                        await broadcast_state_update(
                            priority="INFO",
                            alert_header="SYSTEM RESET",
                            alert_body="Telemetry values normalized back to baseline parameters.",
                            alert_color="#00f0ff"
                        )

            except json.JSONDecodeError:
                print("[Evie Core] Failed to parse raw transmission packet format.")
    except websockets.ConnectionClosedError:
        pass
    finally:
        await unregister(websocket)

async def simulate_background_mesh_activity():
    """
    Background worker task imitating ambient external data drift (e.g., minor fluctuations 
    recorded by wearable sensors) to keep the display looking continuously interactive.
    """
    while True:
        await asyncio.sleep(3.0)  # Drift every 3 seconds
        if CONNECTED_CLIENTS:
            # Shift vitals slightly if no massive spike is happening
            if SYSTEM_STATE["heart_rate_bpm"] < 130:
                SYSTEM_STATE["heart_rate_bpm"] = max(60, min(110, SYSTEM_STATE["heart_rate_bpm"] + random.randint(-4, 5)))
            await broadcast_state_update()

async def main():
    print("[Evie Core] Launching Async WebSocket Telemetry Node...")
    print("[Evie Core] Access endpoint on: ws://localhost:8765")
    
    # Establish server instance
    server = await websockets.serve(handle_incoming_telemetry, "localhost", 8765)
    
    # Run the communication server loop alongside the live background sensor simulator concurrently
    await asyncio.gather(
        server.wait_closed(),
        simulate_background_mesh_activity()
    )

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Evie Core] Orchestration loop halted safely.")
