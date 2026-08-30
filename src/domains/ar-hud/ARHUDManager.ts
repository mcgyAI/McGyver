import { SpatialData, SpatialSnapshot, spatialProcessor } from '../spatial-perception/SpatialProcessor';

/**
 * Small, transport-neutral bridge for AR clients. It normalises a submitted
 * spatial reading through the same processor used by the private API; it does
 * not manufacture sensor readings or perform autonomous surveillance.
 */
export class ARHUDManager {
  processReading(reading: SpatialData): SpatialSnapshot {
    return spatialProcessor.processSpatialData(reading);
  }

  getLatestState(): ReturnType<typeof spatialProcessor.getCurrentEnvironmentState> {
    return spatialProcessor.getCurrentEnvironmentState();
  }
}

export const arHUDManager = new ARHUDManager();
