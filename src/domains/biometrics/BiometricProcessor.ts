// Biometric Processing Domain for Mc'Gyver + Evie Integration
// Handles physiological monitoring, health assessment, and biometric data analysis

export interface BiometricData {
  heartRateBpm: number;
  adrenalineIndex: number;
  galvanicSkinResponse: number;
  velocityMps: number;
  gForceVector: { x: number; y: number; z: number };
  timestamp: Date;
}

export interface BiometricAnalysis {
  currentStatus: 'normal' | 'elevated' | 'stressed' | 'critical';
  heartRateTrend: 'stable' | 'rising' | 'falling' | 'irregular';
  stressLevel: number; // 0-1 scale
  activityLevel: 'resting' | 'light' | 'moderate' | 'intense' | 'extreme';
  healthAlerts: string[];
  recommendations: string[];
}

export interface HealthStatus {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  cardiovascularStatus: string;
  stressStatus: string;
  activityStatus: string;
  riskFactors: string[];
}

class BiometricProcessor {
  private biometricHistory: BiometricData[] = [];
  private maxHistorySize = 200;
  private baselineHeartRate: number = 70; // Will be calibrated
  private stressThresholds = {
    normal: 0.3,
    elevated: 0.6,
    stressed: 0.8,
    critical: 0.9
  };

  // Process biometric data from smartwatch or sensors
  async processBiometricData(rawData: any): Promise<BiometricData> {
    const biometricData: BiometricData = {
      heartRateBpm: rawData.heartRateBpm || 0,
      adrenalineIndex: rawData.adrenalineIndex || 0,
      galvanicSkinResponse: rawData.galvanicSkinResponse || 0,
      velocityMps: rawData.velocityMps || 0,
      gForceVector: rawData.gForceVector || { x: 0, y: 0, z: 0 },
      timestamp: new Date()
    };

    // Store in history
    this.addToHistory(biometricData);

    // Update baseline if we have enough data
    this.updateBaseline();

    // Analyze current state
    const analysis = this.analyzeBiometrics(biometricData);
    
    if (analysis.currentStatus === 'critical') {
      console.log(`[BIOMETRICS] CRITICAL STATUS: ${analysis.currentStatus}`);
      console.log(`[BIOMETRICS] Alerts: ${analysis.healthAlerts.join(', ')}`);
    }

    return biometricData;
  }

  private addToHistory(data: BiometricData): void {
    this.biometricHistory.push(data);
    
    // Maintain history size
    if (this.biometricHistory.length > this.maxHistorySize) {
      this.biometricHistory.shift();
    }
  }

  private updateBaseline(): void {
    if (this.biometricHistory.length < 30) return; // Need at least 30 samples

    // Calculate average heart rate from recent history (excluding elevated periods)
    const recentNormal = this.biometricHistory.slice(-50)
      .filter(data => data.heartRateBpm < 100)
      .map(data => data.heartRateBpm);

    if (recentNormal.length > 10) {
      this.baselineHeartRate = recentNormal.reduce((sum, hr) => sum + hr, 0) / recentNormal.length;
    }
  }

  analyzeBiometrics(currentData: BiometricData): BiometricAnalysis {
    const heartRateAnalysis = this.analyzeHeartRate(currentData.heartRateBpm);
    const stressAnalysis = this.analyzeStress(currentData);
    const activityAnalysis = this.analyzeActivity(currentData);
    
    const healthAlerts = this.generateHealthAlerts(currentData, heartRateAnalysis, stressAnalysis);
    const recommendations = this.generateRecommendations(currentData, stressAnalysis, activityAnalysis);

    // Determine overall status
    let currentStatus: BiometricAnalysis['currentStatus'] = 'normal';
    if (healthAlerts.some(alert => alert.includes('CRITICAL'))) {
      currentStatus = 'critical';
    } else if (healthAlerts.some(alert => alert.includes('WARNING'))) {
      currentStatus = 'stressed';
    } else if (stressAnalysis > this.stressThresholds.elevated) {
      currentStatus = 'elevated';
    }

    return {
      currentStatus,
      heartRateTrend: heartRateAnalysis.trend,
      stressLevel: stressAnalysis,
      activityLevel: activityAnalysis,
      healthAlerts,
      recommendations
    };
  }

  private analyzeHeartRate(currentHeartRate: number): {
    current: number;
    trend: 'stable' | 'rising' | 'falling' | 'irregular';
    deviationFromBaseline: number;
  } {
    const recent = this.biometricHistory.slice(-10);
    const trend = this.calculateHeartRateTrend(recent);
    const deviation = Math.abs(currentHeartRate - this.baselineHeartRate);

    return {
      current: currentHeartRate,
      trend,
      deviationFromBaseline: deviation
    };
  }

  private calculateHeartRateTrend(recent: BiometricData[]): 'stable' | 'rising' | 'falling' | 'irregular' {
    if (recent.length < 3) return 'stable';

    const values = recent.map(d => d.heartRateBpm);
    const changes = [];
    
    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }

    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length;

    if (variance > 20) return 'irregular';
    if (avgChange > 5) return 'rising';
    if (avgChange < -5) return 'falling';
    return 'stable';
  }

  private analyzeStress(data: BiometricData): number {
    // Combined stress score from multiple indicators
    const heartRateStress = Math.min(1, (data.heartRateBpm - this.baselineHeartRate) / 50);
    const adrenalineStress = data.adrenalineIndex;
    const gsrStress = Math.min(1, data.galvanicSkinResponse / 10);
    
    // Weighted average
    return (heartRateStress * 0.4) + (adrenalineStress * 0.4) + (gsrStress * 0.2);
  }

  private analyzeActivity(data: BiometricData): 'resting' | 'light' | 'moderate' | 'intense' | 'extreme' {
    const velocity = data.velocityMps;
    const gForce = Math.sqrt(
      Math.pow(data.gForceVector.x, 2) +
      Math.pow(data.gForceVector.y, 2) +
      Math.pow(data.gForceVector.z, 2)
    );

    if (velocity < 0.5 && gForce < 1.1) return 'resting';
    if (velocity < 2 && gForce < 1.3) return 'light';
    if (velocity < 5 && gForce < 1.5) return 'moderate';
    if (velocity < 10 && gForce < 2.0) return 'intense';
    return 'extreme';
  }

  private generateHealthAlerts(data: BiometricData, heartRateAnalysis: any, stressLevel: number): string[] {
    const alerts: string[] = [];

    // Heart rate alerts
    if (data.heartRateBpm > 180) {
      alerts.push('CRITICAL: Extremely elevated heart rate');
    } else if (data.heartRateBpm > 150) {
      alerts.push('WARNING: Very high heart rate');
    } else if (data.heartRateBpm > 120) {
      alerts.push('NOTICE: Elevated heart rate');
    }

    // Adrenaline alerts
    if (data.adrenalineIndex > 0.9) {
      alerts.push('CRITICAL: Maximum adrenaline levels detected');
    } else if (data.adrenalineIndex > 0.7) {
      alerts.push('WARNING: High adrenaline levels');
    }

    // Stress alerts
    if (stressLevel > this.stressThresholds.critical) {
      alerts.push('CRITICAL: Extreme stress levels');
    } else if (stressLevel > this.stressThresholds.stressed) {
      alerts.push('WARNING: High stress detected');
    }

    // G-force alerts
    const gForce = Math.sqrt(
      Math.pow(data.gForceVector.x, 2) +
      Math.pow(data.gForceVector.y, 2) +
      Math.pow(data.gForceVector.z, 2)
    );

    if (gForce > 3.0) {
      alerts.push('WARNING: High G-force detected');
    } else if (gForce > 5.0) {
      alerts.push('CRITICAL: Dangerous G-force levels');
    }

    return alerts;
  }

  private generateRecommendations(data: BiometricData, stressLevel: number, activityLevel: string): string[] {
    const recommendations: string[] = [];

    if (stressLevel > this.stressThresholds.elevated) {
      recommendations.push('Consider stress reduction techniques');
      recommendations.push('Monitor for signs of burnout');
    }

    if (activityLevel === 'intense' || activityLevel === 'extreme') {
      recommendations.push('Ensure adequate hydration');
      recommendations.push('Monitor for overexertion');
    }

    if (data.heartRateBpm > 120 && activityLevel === 'resting') {
      recommendations.push('Rest recommended - elevated heart rate at rest');
    }

    if (data.adrenalineIndex > 0.6) {
      recommendations.push('Allow time for adrenaline levels to normalize');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue normal activity monitoring');
    }

    return recommendations;
  }

  // Get comprehensive health status
  getHealthStatus(): HealthStatus {
    if (this.biometricHistory.length === 0) {
      return {
        overallHealth: 'good',
        cardiovascularStatus: 'Insufficient data',
        stressStatus: 'Insufficient data',
        activityStatus: 'Insufficient data',
        riskFactors: []
      };
    }

    const latest = this.biometricHistory[this.biometricHistory.length - 1];
    const analysis = this.analyzeBiometrics(latest);

    // Cardiovascular status
    let cardiovascularStatus = 'Normal';
    if (latest.heartRateBpm > 120) cardiovascularStatus = 'Elevated';
    if (latest.heartRateBpm > 150) cardiovascularStatus = 'High';
    if (latest.heartRateBpm > 180) cardiovascularStatus = 'Critical';

    // Stress status
    let stressStatus = 'Low';
    if (analysis.stressLevel > this.stressThresholds.normal) stressStatus = 'Moderate';
    if (analysis.stressLevel > this.stressThresholds.elevated) stressStatus = 'High';
    if (analysis.stressLevel > this.stressThresholds.stressed) stressStatus = 'Severe';

    // Activity status
    const activityStatus = analysis.activityLevel.charAt(0).toUpperCase() + analysis.activityLevel.slice(1);

    // Overall health assessment
    let overallHealth: HealthStatus['overallHealth'] = 'good';
    if (analysis.currentStatus === 'critical') overallHealth = 'critical';
    else if (analysis.currentStatus === 'stressed') overallHealth = 'fair';
    else if (analysis.currentStatus === 'elevated') overallHealth = 'good';

    // Risk factors
    const riskFactors: string[] = [];
    if (cardiovascularStatus !== 'Normal') riskFactors.push(cardiovascularStatus + ' heart rate');
    if (stressStatus !== 'Low') riskFactors.push('Elevated stress');
    if (analysis.activityLevel === 'extreme') riskFactors.push('Extreme activity');

    return {
      overallHealth,
      cardiovascularStatus,
      stressStatus,
      activityStatus,
      riskFactors
    };
  }

  // Get biometric history
  getBiometricHistory(count: number = 50): BiometricData[] {
    return this.biometricHistory.slice(-count);
  }

  // Detect adrenaline spike
  detectAdrenalineSpike(): boolean {
    if (this.biometricHistory.length < 5) return false;

    const recent = this.biometricHistory.slice(-5);
    const avgAdrenaline = recent.reduce((sum, data) => sum + data.adrenalineIndex, 0) / recent.length;
    const current = recent[recent.length - 1].adrenalineIndex;

    return current > avgAdrenaline * 1.5 && current > 0.5;
  }

  // Calibrate baseline heart rate
  calibrateBaseline(): void {
    if (this.biometricHistory.length < 30) {
      console.log('[BIOMETRICS] Insufficient data for calibration (need 30+ samples)');
      return;
    }

    const recent = this.biometricHistory.slice(-100);
    const normalPeriods = recent.filter(data => data.heartRateBpm < 100);
    
    if (normalPeriods.length > 20) {
      this.baselineHeartRate = normalPeriods.reduce((sum, data) => sum + data.heartRateBpm, 0) / normalPeriods.length;
      console.log(`[BIOMETRICS] Baseline calibrated to ${this.baselineHeartRate.toFixed(1)} BPM`);
    }
  }
}

export const biometricProcessor = new BiometricProcessor();