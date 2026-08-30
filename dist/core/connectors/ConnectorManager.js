"use strict";
// Registers every connector's tools into toolRegistry at boot. Adding a
// real connector later (calendar, email, home automation) means writing
// one file like filesConnector.ts and adding one line here - nothing
// else in the system needs to change.
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectorManager = exports.ConnectorManager = void 0;
const toolRegistry_1 = require("../registries/toolRegistry");
const filesConnector_1 = require("../../services/filesConnector");
class ConnectorManager {
    registerAll() {
        (0, filesConnector_1.registerFilesConnector)();
        // Next connector goes here, e.g.:
        // registerCalendarConnector();
        const ids = toolRegistry_1.toolRegistry.list().map(t => t.id).join(', ');
        console.log(`[MCGYVER] Connectors registered: ${ids || 'none'}`);
    }
}
exports.ConnectorManager = ConnectorManager;
exports.connectorManager = new ConnectorManager();
//# sourceMappingURL=ConnectorManager.js.map