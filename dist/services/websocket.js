"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebSocketServer = createWebSocketServer;
/**
 * Optional private real-time transport boundary. WebSocket infrastructure is
 * not enabled in this deployment; callers must supply an authenticated
 * transport implementation before using this capability.
 */
function createWebSocketServer() {
    throw new Error('WebSocket transport is not configured for this private deployment');
}
//# sourceMappingURL=websocket.js.map