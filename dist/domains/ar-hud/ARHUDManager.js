"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arHUDManager = exports.ARHUDManager = void 0;
const SpatialProcessor_1 = require("../spatial-perception/SpatialProcessor");
/**
 * Small, transport-neutral bridge for AR clients. It normalises a submitted
 * spatial reading through the same processor used by the private API; it does
 * not manufacture sensor readings or perform autonomous surveillance.
 */
class ARHUDManager {
    processReading(reading) {
        return SpatialProcessor_1.spatialProcessor.processSpatialData(reading);
    }
    getLatestState() {
        return SpatialProcessor_1.spatialProcessor.getCurrentEnvironmentState();
    }
}
exports.ARHUDManager = ARHUDManager;
exports.arHUDManager = new ARHUDManager();
//# sourceMappingURL=ARHUDManager.js.map