"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spatialProcessor = void 0;
class SpatialProcessor {
    spatialHistory = [];
    maxHistorySize = 100;
    processSpatialData(data) {
        const snapshot = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            detectedObjects: data.detectedObjects || [],
            ambientLightLux: data.ambientLightLux || 0,
            gazeTargetCoords: data.gazeTargetCoords || { x: 0, y: 0 }
        };
        this.spatialHistory.push(snapshot);
        if (this.spatialHistory.length > this.maxHistorySize) {
            this.spatialHistory.shift();
        }
        console.log(`[SPATIAL] Processed ${snapshot.detectedObjects.length} detected objects`);
        return snapshot;
    }
    assessThreats(snapshot) {
        const threats = [];
        for (const obj of snapshot.detectedObjects) {
            if (obj.label === 'unknown' || obj.label === 'drone') {
                if (obj.distanceMeters < 20) {
                    threats.push({
                        type: obj.label,
                        severity: obj.distanceMeters < 10 ? 'critical' : 'high',
                        distance: obj.distanceMeters,
                        recommendedAction: 'Immediate investigation required'
                    });
                }
            }
        }
        const overallThreatLevel = this.calculateOverallThreatLevel(threats);
        return {
            hasThreats: threats.length > 0,
            threats,
            overallThreatLevel
        };
    }
    calculateOverallThreatLevel(threats) {
        if (threats.some(t => t.severity === 'critical'))
            return 'critical';
        if (threats.some(t => t.severity === 'high'))
            return 'high';
        if (threats.some(t => t.severity === 'medium'))
            return 'medium';
        if (threats.some(t => t.severity === 'low'))
            return 'low';
        return 'none';
    }
    getRecentSpatialHistory(count) {
        return this.spatialHistory.slice(-count);
    }
    getCurrentEnvironmentState() {
        if (this.spatialHistory.length === 0) {
            return { status: 'no_data' };
        }
        const latest = this.spatialHistory[this.spatialHistory.length - 1];
        return {
            objectCount: latest.detectedObjects.length,
            ambientLight: latest.ambientLightLux,
            lastUpdate: latest.timestamp
        };
    }
}
exports.spatialProcessor = new SpatialProcessor();
//# sourceMappingURL=SpatialProcessor.js.map