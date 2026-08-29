"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.biometricProcessor = void 0;
class BiometricProcessor {
    biometricHistory = [];
    maxHistorySize = 50;
    baselineHeartRate = 72;
    processBiometricData(data) {
        const biometric = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            heartRateBpm: data.heartRateBpm || 0,
            adrenalineIndex: data.adrenalineIndex || 0,
            galvanicSkinResponse: data.galvanicSkinResponse || 0,
            velocityMps: data.velocityMps || 0,
            gForceVector: data.gForceVector || { x: 0, y: 0, z: 0 }
        };
        this.biometricHistory.push(biometric);
        if (this.biometricHistory.length > this.maxHistorySize) {
            this.biometricHistory.shift();
        }
        console.log(`[BIOMETRIC] Heart rate: ${biometric.heartRateBpm} BPM, Adrenaline: ${biometric.adrenalineIndex}`);
        return biometric;
    }
    analyzeBiometrics(biometric) {
        const alerts = [];
        let status = 'normal';
        let stressLevel = 'low';
        // Heart rate analysis
        if (biometric.heartRateBpm > 130) {
            status = 'critical';
            stressLevel = 'severe';
            alerts.push('Critical heart rate elevation detected');
        }
        else if (biometric.heartRateBpm > 100) {
            status = 'elevated';
            stressLevel = 'high';
            alerts.push('Elevated heart rate detected');
        }
        else if (biometric.heartRateBpm > 85) {
            status = 'elevated';
            stressLevel = 'medium';
        }
        // Adrenaline analysis
        if (biometric.adrenalineIndex > 0.7) {
            if (stressLevel !== 'severe')
                stressLevel = 'high';
            alerts.push('High adrenaline levels detected');
        }
        // GSR analysis
        if (biometric.galvanicSkinResponse > 5) {
            alerts.push('Elevated galvanic skin response');
        }
        // Activity analysis
        if (biometric.velocityMps > 10) {
            alerts.push('High velocity movement detected');
        }
        return {
            currentStatus: status,
            heartRateTrend: this.calculateHeartRateTrend(),
            healthAlerts: alerts,
            stressLevel
        };
    }
    calculateHeartRateTrend() {
        if (this.biometricHistory.length < 3)
            return 'stable';
        const recent = this.biometricHistory.slice(-3);
        const rates = recent.map(b => b.heartRateBpm);
        if (rates[2] > rates[1] + 10 && rates[1] > rates[0] + 10)
            return 'rising';
        if (rates[2] < rates[1] - 10 && rates[1] < rates[0] - 10)
            return 'falling';
        const variance = Math.max(...rates) - Math.min(...rates);
        if (variance > 20)
            return 'irregular';
        return 'stable';
    }
    getBiometricHistory(count) {
        return this.biometricHistory.slice(-count);
    }
    getCurrentPhysiologicalState() {
        if (this.biometricHistory.length === 0) {
            return { status: 'no_data' };
        }
        const latest = this.biometricHistory[this.biometricHistory.length - 1];
        const analysis = this.analyzeBiometrics(latest);
        return {
            heartRate: latest.heartRateBpm,
            adrenaline: latest.adrenalineIndex,
            status: analysis.currentStatus,
            stressLevel: analysis.stressLevel,
            alerts: analysis.healthAlerts
        };
    }
}
exports.biometricProcessor = new BiometricProcessor();
//# sourceMappingURL=BiometricProcessor.js.map