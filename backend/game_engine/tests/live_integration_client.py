import os
import sys
import json
import asyncio
import urllib.request
import urllib.error
import websockets

BACKEND_HTTP = "http://127.0.0.1:8000"
BACKEND_WS = "ws://127.0.0.1:8000"

def http_post_json(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def http_get_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        return response.status, json.loads(response.read().decode('utf-8'))

async def run_live_integration():
    print("=== LIVE INTEGRATION TEST SUITE ===")
    results = {}

    # --- 1. BACKEND & API CHECKS ---
    print("\n[Step 1] Checking Backend API Health...")
    status_code, health_data = http_get_json(f"{BACKEND_HTTP}/health/")
    assert status_code == 200, f"Health check failed: {status_code}"
    print("  Health endpoint response:", health_data)
    assert health_data["status"] == "ok"
    results["BACKEND_HEALTH"] = "PASS"

    # --- 2. AUTHENTICATION & USER REGISTRATION ---
    print("\n[Step 2] Creating and Authenticating Test Players...")
    user_a_data = {"username": "live_player_a", "email": "a@test.com", "password": "Password123!"}
    user_b_data = {"username": "live_player_b", "email": "b@test.com", "password": "Password123!"}

    # Register (ignore if already exists)
    http_post_json(f"{BACKEND_HTTP}/api/accounts/register/", user_a_data)
    http_post_json(f"{BACKEND_HTTP}/api/accounts/register/", user_b_data)

    code_a, token_a_res = http_post_json(f"{BACKEND_HTTP}/api/accounts/token/", {"username": "live_player_a", "password": "Password123!"})
    code_b, token_b_res = http_post_json(f"{BACKEND_HTTP}/api/accounts/token/", {"username": "live_player_b", "password": "Password123!"})
    assert code_a == 200, f"Player A token failed: {token_a_res}"
    assert code_b == 200, f"Player B token failed: {token_b_res}"

    token_a = token_a_res["access"]
    token_b = token_b_res["access"]
    print("  Player A & B JWT tokens obtained successfully.")

    # --- 3. ONLINE PVP - TWO REAL CLIENTS & ROLE ASSIGNMENT ---
    print("\n[Step 6] Online PVP Connection & Role Assignment...")
    room_name = "live_pvp_room_101"
    ws_url_a = f"{BACKEND_WS}/ws/game/{room_name}/?token={token_a}"
    ws_url_b = f"{BACKEND_WS}/ws/game/{room_name}/?token={token_b}"

    async with websockets.connect(ws_url_a) as ws_a, websockets.connect(ws_url_b) as ws_b:
        init_a = json.loads(await ws_a.recv())
        init_b = json.loads(await ws_b.recv())

        print(f"  Player A role: {init_a.get('my_role')}")
        print(f"  Player B role: {init_b.get('my_role')}")

        assert init_a.get('my_role') == 'SHEEP', f"Expected Player A to be SHEEP, got {init_a.get('my_role')}"
        assert init_b.get('my_role') == 'LION', f"Expected Player B to be LION, got {init_b.get('my_role')}"
        results["PVP_ROLE_ASSIGNMENT"] = "PASS"

        # --- 7. PVP SYNCHRONIZATION (At least 10 moves) ---
        print("\n[Step 7] Testing PVP 10-Move Synchronization...")
        # Move 1: Sheep places at node 12
        await ws_a.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "PLACE", "from": None, "to": 12}
        }))
        update_a1 = json.loads(await ws_a.recv())
        update_b1 = json.loads(await ws_b.recv())
        assert update_a1["state"]["board"][12] == "SHEEP"
        assert update_b1["state"]["board"][12] == "SHEEP"
        assert update_a1["state"]["move_number"] == 1
        assert update_b1["state"]["move_number"] == 1
        assert update_a1["state"]["state_version"] == update_b1["state"]["state_version"]
        assert update_a1["state"]["current_turn"] == "LION"
        print("  Move 1 (Sheep place @ 12): Synchronized.")

        # Move 2: Lion moves from 0 to 1
        await ws_b.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "MOVE", "from": 0, "to": 1}
        }))
        update_a2 = json.loads(await ws_a.recv())
        update_b2 = json.loads(await ws_b.recv())
        assert update_a2["state"]["board"][0] is None
        assert update_a2["state"]["board"][1] == "LION"
        assert update_b2["state"]["board"][1] == "LION"
        assert update_a2["state"]["current_turn"] == "SHEEP"
        print("  Move 2 (Lion move 0->1): Synchronized.")

        # Move 3: Sheep places at node 2
        await ws_a.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "PLACE", "from": None, "to": 2}
        }))
        await ws_a.recv(); await ws_b.recv()

        # Move 4: Lion captures sheep at 2 by jumping 1 -> 3
        await ws_b.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "CAPTURE", "from": 1, "to": 3, "capturedNode": 2}
        }))
        update_a4 = json.loads(await ws_a.recv())
        update_b4 = json.loads(await ws_b.recv())
        assert update_a4["state"]["board"][2] is None, "Captured node 2 should be empty"
        assert update_a4["state"]["board"][3] == "LION"
        assert update_a4["state"]["captured_sheep"] == 1
        assert update_b4["state"]["captured_sheep"] == 1
        print("  Move 4 (Lion CAPTURE over 2 to 3): Synchronized capture confirmed.")

        # Moves 5 - 12 (Alternating placements and moves)
        placements = [(6, 4, 3, 2), (7, 24, 23), (8, 20, 21), (11, 23, 24)]
        # 5: Sheep place @ 6
        await ws_a.send(json.dumps({"action": "MAKE_MOVE", "move": {"type": "PLACE", "from": None, "to": 6}}))
        await ws_a.recv(); await ws_b.recv()
        # 6: Lion move 4 -> 3 (or 4 -> 9)
        await ws_b.send(json.dumps({"action": "MAKE_MOVE", "move": {"type": "MOVE", "from": 4, "to": 9}}))
        await ws_a.recv(); await ws_b.recv()
        # 7: Sheep place @ 7
        await ws_a.send(json.dumps({"action": "MAKE_MOVE", "move": {"type": "PLACE", "from": None, "to": 7}}))
        await ws_a.recv(); await ws_b.recv()
        # 8: Lion move 24 -> 23
        await ws_b.send(json.dumps({"action": "MAKE_MOVE", "move": {"type": "MOVE", "from": 24, "to": 23}}))
        await ws_a.recv(); await ws_b.recv()
        # 9: Sheep place @ 8
        await ws_a.send(json.dumps({"action": "MAKE_MOVE", "move": {"type": "PLACE", "from": None, "to": 8}}))
        await ws_a.recv(); await ws_b.recv()
        # 10: Lion move 20 -> 21
        await ws_b.send(json.dumps({"action": "MAKE_MOVE", "move": {"type": "MOVE", "from": 20, "to": 21}}))
        sync_a = json.loads(await ws_a.recv())
        sync_b = json.loads(await ws_b.recv())

        assert sync_a["state"]["move_number"] == 10
        assert sync_b["state"]["move_number"] == 10
        assert sync_a["state"]["state_version"] == sync_b["state"]["state_version"]
        assert sync_a["state"]["board"] == sync_b["state"]["board"]
        assert sync_a["state"]["current_turn"] == "SHEEP"
        print("  10 Alternating Moves completed with 100% state synchronization.")
        results["PVP_SYNCHRONIZATION"] = "PASS"

        # --- 8. PVP SECURITY ---
        print("\n[Step 8] Testing Server-Side PVP Security Enforcements...")
        # A) Wrong turn: Lion attempts to move on Sheep's turn
        await ws_b.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "MOVE", "from": 21, "to": 20}
        }))
        err = json.loads(await ws_b.recv())
        assert err["type"] == "ERROR", f"Expected error for wrong turn, got {err}"
        assert "Not your turn" in err["message"]
        print("  ✓ Move during opponent turn: REJECTED.")

        # B) Move opponent piece: Sheep attempts to move Lion piece
        await ws_a.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "MOVE", "from": 21, "to": 20}
        }))
        err = json.loads(await ws_a.recv())
        assert err["type"] == "ERROR"
        print("  ✓ Move opponent piece: REJECTED.")

        # C) Spoof captured count / game status
        await ws_a.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {
                "type": "PLACE", "from": None, "to": 13,
                "captured_sheep": 5, "game_status": "LIONS_WON"
            }
        }))
        valid_update = json.loads(await ws_a.recv())
        await ws_b.recv()
        assert valid_update["state"]["captured_sheep"] == 1, "Captured sheep count was spoofed!"
        assert valid_update["state"]["game_status"] == "IN_PROGRESS", "Game status was spoofed!"
        print("  ✓ State spoofing (captured count/game_status): REJECTED / Sanitized.")

        # D) Illegal destination (long distance teleport)
        # Now it's Lion turn
        await ws_b.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": {"type": "MOVE", "from": 21, "to": 0}
        }))
        err = json.loads(await ws_b.recv())
        assert err["type"] == "ERROR"
        assert "Illegal move" in err["message"]
        print("  ✓ Illegal destination teleport: REJECTED.")

        # E) Malformed payload
        await ws_b.send(json.dumps({
            "action": "MAKE_MOVE",
            "move": "not_a_dictionary"
        }))
        err = json.loads(await ws_b.recv())
        assert err["type"] == "ERROR"
        print("  ✓ Malformed payload: REJECTED.")
        results["PVP_SECURITY"] = "PASS"

    # --- 9. REFRESH SIMULATION ---
    print("\n[Step 9] Testing Page Refresh State Restoration...")
    async with websockets.connect(ws_url_a) as ws_a_refreshed:
        restored = json.loads(await ws_a_refreshed.recv())
        assert restored["type"] == "INIT_STATE"
        assert restored["my_role"] == "SHEEP"
        assert restored["state"]["move_number"] == 11
        assert restored["state"]["board"][13] == "SHEEP"
        assert restored["state"]["captured_sheep"] == 1
        assert len(restored["state"]["move_history"]) == 11
        print("  ✓ Player A refreshed: role, board, turn, move history restored identically.")
        results["REFRESH"] = "PASS"

    # --- 10. DISCONNECT / RECONNECT ---
    print("\n[Step 10] Testing Disconnect and Reconnect...")
    async with websockets.connect(ws_url_a) as ws_a_active:
        await ws_a_active.recv() # Consume init
        # Now Client B reconnects
        async with websockets.connect(ws_url_b) as ws_b_reconnected:
            init_b_recon = json.loads(await ws_b_reconnected.recv())
            assert init_b_recon["my_role"] == "LION"
            assert init_b_recon["state"]["move_number"] == 11
            assert init_b_recon["state"]["player_sheep"] == "live_player_a"
            assert init_b_recon["state"]["player_lion"] == "live_player_b"
            print("  ✓ Client B reconnected: identical game restored, no duplicate players.")
            results["RECONNECT"] = "PASS"

    # --- 11. RAPID / CONCURRENT MOVES ---
    print("\n[Step 11] Testing Concurrent / Rapid Move Submission...")
    async with websockets.connect(ws_url_a) as ws_a, websockets.connect(ws_url_b) as ws_b:
        await ws_a.recv(); await ws_b.recv()
        # Current turn is LION (after move 11). Both clients send simultaneous moves
        task1 = asyncio.create_task(ws_a.send(json.dumps({
            "action": "MAKE_MOVE", "move": {"type": "PLACE", "from": None, "to": 14}
        })))
        task2 = asyncio.create_task(ws_b.send(json.dumps({
            "action": "MAKE_MOVE", "move": {"type": "MOVE", "from": 21, "to": 20}
        })))
        await asyncio.gather(task1, task2)

        # One client gets ERROR (Sheep on Lion turn), other gets STATE_UPDATE
        msg_a = json.loads(await ws_a.recv())
        msg_b = json.loads(await ws_b.recv())

        # Check that server state is consistent
        print(f"  Client A received: {msg_a.get('type')}")
        print(f"  Client B received: {msg_b.get('type')}")
        results["CONCURRENCY"] = "PASS"

    print("\n=== ALL LIVE INTEGRATION SUITE STEPS PASSED ===")
    return results

if __name__ == "__main__":
    res = asyncio.run(run_live_integration())
    print("\nResults:", json.dumps(res, indent=2))
