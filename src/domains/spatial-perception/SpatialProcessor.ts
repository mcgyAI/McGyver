export interface SpatialSnapshot {
  id: string;
  timestamp: string;
  detectedObjects: DetectedObject[];
  ambientLightLux: number;
  gazeTargetCoords: { x: number; y: number };
}

/**
 * Compatibility shape for physical-awareness clients that submit a spatial
 * reading before it has been normalised into a SpatialSnapshot.  Keeping this
 * separate from the stored snapshot lets AR clients remain typed without
 * pretending that browser-originated values are already validated telemetry.
 */
export interface SpatialData {
  detectedObjects?: DetectedObject[];
  ambientLightLux?: number;
  gazeTargetCoords?: { x: number; y: number };
}

export interface DetectedObject {
  label: string;
  confidence: number;
  distanceMeters: number;
  vector: [number, number, number];
}

export interface ThreatAssessment {
  hasThreats: boolean;
  threats: Threat[];
  overallThreatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface Threat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  distance: number;
  recommendedAction: string;
}

class SpatialProcessor {
  private spatialHistory: SpatialSnapshot[] = [];
  private maxHistorySize = 100;

  processSpatialData(data: any): SpatialSnapshot {
    const snapshot: SpatialSnapshot = {
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

  assessThreats(snapshot: SpatialSnapshot): ThreatAssessment {
    const threats: Threat[] = [];
    
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

  private calculateOverallThreatLevel(threats: Threat[]): ThreatAssessment['overallThreatLevel'] {
    if (threats.some(t => t.severity === 'critical')) return 'critical';
    if (threats.some(t => t.severity === 'high')) return 'high';
    if (threats.some(t => t.severity === 'medium')) return 'medium';
    if (threats.some(t => t.severity === 'low')) return 'low';
    return 'none';
  }

  getRecentSpatialHistory(count: number): SpatialSnapshot[] {
    return this.spatialHistory.slice(-count);
  }

  getCurrentEnvironmentState(): any {
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

export const spatialProcessor = new SpatialProcessor();
