/**
 * Optional private real-time transport boundary. WebSocket infrastructure is
 * not enabled in this deployment; callers must supply an authenticated
 * transport implementation before using this capability.
 */
export function createWebSocketServer(): never {
  throw new Error('WebSocket transport is not configured for this private deployment');
}
