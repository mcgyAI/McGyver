// Spatial Perception Domain for Mc'Gyver + Evie Integration
// Handles environmental awareness, object detection, and spatial mapping

export interface SpatialObject {
  label: string;
  confidence: number;
  distanceMeters: number;
  vector: [number, number, number];
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SpatialData {
  detectedObjects: SpatialObject[];
  ambientLightLux: number;
  gazeTargetCoords: { x: number; y: number };
  timestamp: Date;
}

export interface SpatialMap {
  roomDimensions: { width: number; height: number; depth: number };
  objects: Map<string, SpatialObject>;
  safeZones: Array<{ name: string; area: any }>;
  hazardZones: Array<{ name: string; area: any; severity: 'low' | 'medium' | 'high' }>;
}

export interface ThreatAssessment {
  hasThreats: boolean;
  threats: Array<{
    object: SpatialObject;
    threatType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendedAction: string;
  }>;
  overallThreatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

class SpatialProcessor {
  private spatialMemory: Map<string, SpatialData> = new Map();
  private spatialMap: SpatialMap = this.initializeSpatialMap();
  private objectHistory: Map<string, SpatialObject[]> = new Map();

  private initializeSpatialMap(): SpatialMap {
    return {
      roomDimensions: { width: 10, height: 3, depth: 10 }, // Default 10x3x10m room
      objects: new Map(),
      safeZones: [],
      hazardZones: []
    };
  }

  // Process spatial data from AR glasses or cameras
  async processSpatialData(rawData: any): Promise<SpatialData> {
    const spatialData: SpatialData = {
      detectedObjects: this.parseDetectedObjects(rawData.objects || []),
      ambientLightLux: rawData.ambientLightLux || 0,
      gazeTargetCoords: rawData.gazeTargetCoords || { x: 0, y: 0 },
      timestamp: new Date()
    };

    // Store in spatial memory
    const memoryKey = this.generateMemoryKey(spatialData.timestamp);
    this.spatialMemory.set(memoryKey, spatialData);

    // Update object history for tracking
    this.updateObjectHistory(spatialData.detectedObjects);

    // Update spatial map
    this.updateSpatialMap(spatialData);

    // Perform threat assessment
    const threatAssessment = this.assessThreats(spatialData);
    if (threatAssessment.hasThreats) {
      console.log(`[SPATIAL] Threats detected: ${threatAssessment.threats.length} (${threatAssessment.overallThreatLevel})`);
    }

    return spatialData;
  }

  private parseDetectedObjects(rawObjects: any[]): SpatialObject[] {
    return rawObjects.map(obj => ({
      label: obj.label || 'unknown',
      confidence: obj.confidence || 0,
      distanceMeters: obj.distanceMeters || 0,
      vector: obj.vector || [0, 0, 0],
      boundingBox: obj.boundingBox
    }));
  }

  private generateMemoryKey(timestamp: Date): string {
    return `spatial_${timestamp.getTime()}`;
  }

  private updateObjectHistory(objects: SpatialObject[]): void {
    objects.forEach(obj => {
      const history = this.objectHistory.get(obj.label) || [];
      history.push(obj);
      
      // Keep only last 10 detections per object type
      if (history.length > 10) {
        history.shift();
      }
      
      this.objectHistory.set(obj.label, history);
    });
  }

  private updateSpatialMap(spatialData: SpatialData): void {
    // Update objects in spatial map
    spatialData.detectedObjects.forEach(obj => {
      const objId = `${obj.label}_${obj.vector.join('_')}`;
      this.spatialMap.objects.set(objId, obj);
    });

    // Clean up old objects (not seen in last 5 detections)
    this.cleanupOldObjects();
  }

  private cleanupOldObjects(): void {
    const currentTime = Date.now();
    const staleThreshold = 5000; // 5 seconds

    this.spatialMap.objects.forEach((obj, key) => {
      const history = this.objectHistory.get(obj.label) || [];
      const lastSeen = history.length > 0 ? history[history.length - 1] : null;
      
      if (lastSeen && (currentTime - new Date().getTime()) > staleThreshold) {
        this.spatialMap.objects.delete(key);
      }
    });
  }

  assessThreats(spatialData: SpatialData): ThreatAssessment {
    const threats: ThreatAssessment['threats'] = [];
    
    spatialData.detectedObjects.forEach(obj => {
      const threat = this.evaluateObjectThreat(obj);
      if (threat) {
        threats.push(threat);
      }
    });

    const overallThreatLevel = this.calculateOverallThreatLevel(threats);

    return {
      hasThreats: threats.length > 0,
      threats,
      overallThreatLevel
    };
  }

  private evaluateObjectThreat(obj: SpatialObject): ThreatAssessment['threats'][0] | null {
    // Threat evaluation logic
    const threatKeywords = ['weapon', 'threat', 'danger', 'hostile', 'aggressive', 'fire', 'explosive'];
    const isThreatObject = threatKeywords.some(keyword => 
      obj.label.toLowerCase().includes(keyword)
    );

    if (isThreatObject) {
      return {
        object: obj,
        threatType: 'Hostile Object',
        severity: obj.distanceMeters < 5 ? 'critical' : 'high',
        recommendedAction: obj.distanceMeters < 5 ? 'IMMEDIATE EVASION' : 'Increase distance and seek cover'
      };
    }

    // Proximity threat
    if (obj.distanceMeters < 2 && obj.confidence > 0.8) {
      return {
        object: obj,
        threatType: 'Proximity Hazard',
        severity: 'medium',
        recommendedAction: 'Maintain awareness of nearby object'
      };
    }

    return null;
  }

  private calculateOverallThreatLevel(threats: ThreatAssessment['threats']): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (threats.length === 0) return 'none';
    
    const hasCritical = threats.some(t => t.severity === 'critical');
    const hasHigh = threats.some(t => t.severity === 'high');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (threats.length > 2) return 'medium';
    return 'low';
  }

  // Get current spatial map
  getSpatialMap(): SpatialMap {
    return this.spatialMap;
  }

  // Get recent spatial history
  getRecentSpatialHistory(count: number = 10): SpatialData[] {
    const recent = Array.from(this.spatialMemory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
    
    return recent;
  }

  // Get object tracking history
  getObjectHistory(objectLabel: string): SpatialObject[] {
    return this.objectHistory.get(objectLabel) || [];
  }

  // Analyze movement patterns
  analyzeMovementPatterns(objectLabel: string): {
    direction: string;
    speed: number;
    prediction: [number, number, number];
  } {
    const history = this.getObjectHistory(objectLabel);
    if (history.length < 2) {
      return {
        direction: 'insufficient_data',
        speed: 0,
        prediction: [0, 0, 0]
      };
    }

    const recent = history.slice(-3);
    const direction = this.calculateMovementDirection(recent);
    const speed = this.calculateMovementSpeed(recent);
    const prediction = this.predictNextPosition(recent);

    return { direction, speed, prediction };
  }

  private calculateMovementDirection(history: SpatialObject[]): string {
    if (history.length < 2) return 'stationary';

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const dx = latest.vector[0] - previous.vector[0];
    const dy = latest.vector[1] - previous.vector[1];
    const dz = latest.vector[2] - previous.vector[2];

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > Math.abs(dz)) {
      return dy > 0 ? 'up' : 'down';
    } else {
      return dz > 0 ? 'forward' : 'backward';
    }
  }

  private calculateMovementSpeed(history: SpatialObject[]): number {
    if (history.length < 2) return 0;

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const distance = Math.sqrt(
      Math.pow(latest.vector[0] - previous.vector[0], 2) +
      Math.pow(latest.vector[1] - previous.vector[1], 2) +
      Math.pow(latest.vector[2] - previous.vector[2], 2)
    );

    // Simple speed calculation (units per second would need timestamp data)
    return distance;
  }

  private predictNextPosition(history: SpatialObject[]): [number, number, number] {
    if (history.length < 2) return [0, 0, 0];

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const dx = latest.vector[0] - previous.vector[0];
    const dy = latest.vector[1] - previous.vector[1];
    const dz = latest.vector[2] - previous.vector[2];

    return [
      latest.vector[0] + dx,
      latest.vector[1] + dy,
      latest.vector[2] + dz
    ];
  }
}

export const spatialProcessor = new SpatialProcessor();