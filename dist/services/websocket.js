"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = void 0;
const socket_io_1 = require("socket.io");
class WebSocketService {
    io = null;
    devices = new Map();
    biometricHistory = [];
    spatialHistory = [];
    maxHistorySize = 100;
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
                credentials: true
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`[EVIE] Device connected: ${socket.id}`);
            // Device registration
            socket.on('register_device', (data) => {
                const device = {
                    deviceId: socket.id,
                    deviceType: data.deviceType,
                    capabilities: data.capabilities,
                    connectionTime: new Date(),
                    lastSeen: new Date()
                };
                this.devices.set(socket.id, device);
                console.log(`[EVIE] Device registered: ${data.deviceType} with capabilities: ${data.capabilities.join(', ')}`);
                // Send acknowledgment
                socket.emit('device_registered', {
                    success: true,
                    deviceId: socket.id,
                    timestamp: new Date().toISOString()
                });
            });
            // Biometric data from smartwatch
            socket.on('biometric_data', (data) => {
                this.handleBiometricData(socket.id, data);
            });
            // Spatial data from AR glasses
            socket.on('spatial_data', (data) => {
                this.handleSpatialData(socket.id, data);
            });
            // HUD control commands
            socket.on('hud_command', (command) => {
                this.handleHUDCommand(socket.id, command);
            });
            // Disconnect handling
            socket.on('disconnect', () => {
                const device = this.devices.get(socket.id);
                if (device) {
                    console.log(`[EVIE] Device disconnected: ${device.deviceType} (${socket.id})`);
                    this.devices.delete(socket.id);
                }
            });
        });
        console.log('[EVIE] WebSocket service initialized');
    }
    handleBiometricData(deviceId, data) {
        // Store in history
        this.biometricHistory.push(data);
        if (this.biometricHistory.length > this.maxHistorySize) {
            this.biometricHistory.shift();
        }
        // Update device last seen
        const device = this.devices.get(deviceId);
        if (device) {
            device.lastSeen = new Date();
        }
        // Create telemetry event
        const event = {
            eventType: 'BIOMETRIC_UPDATE',
            timestamp: new Date().toISOString(),
            priority: this.determineBiometricPriority(data),
            payload: data
        };
        // Broadcast to relevant devices
        this.broadcastToDevicesWithCapability('biometric_display', event);
        // Trigger neuro-agent processing if significant
        if (event.priority === 'HIGH' || event.priority === 'CRITICAL') {
            this.triggerNeuroAgentProcessing(event);
        }
        console.log(`[EVIE] Biometric data received: ${data.heartRateBpm} BPM, adrenaline: ${data.adrenalineIndex}`);
    }
    handleSpatialData(deviceId, data) {
        // Store in history
        this.spatialHistory.push(data);
        if (this.spatialHistory.length > this.maxHistorySize) {
            this.spatialHistory.shift();
        }
        // Update device last seen
        const device = this.devices.get(deviceId);
        if (device) {
            device.lastSeen = new Date();
        }
        // Create telemetry event
        const event = {
            eventType: 'SPATIAL_DETECTION',
            timestamp: new Date().toISOString(),
            priority: this.determineSpatialPriority(data),
            payload: data
        };
        // Broadcast to AR devices
        this.broadcastToDevicesWithCapability('ar_display', event);
        // Trigger threat assessment if needed
        if (event.priority === 'HIGH' || event.priority === 'CRITICAL') {
            this.triggerThreatAssessment(data);
        }
        console.log(`[EVIE] Spatial data received: ${data.detectedObjects.length} objects detected`);
    }
    handleHUDCommand(deviceId, command) {
        console.log(`[EVIE] HUD command from ${deviceId}: ${command.action}`);
        // Process HUD commands
        switch (command.action) {
            case 'update_widget':
                this.updateHUDWidget(command.params);
                break;
            case 'trigger_alert':
                this.triggerAlert(command.params);
                break;
            case 'request_status':
                this.sendSystemStatus(deviceId);
                break;
            default:
                console.warn(`[EVIE] Unknown HUD command: ${command.action}`);
        }
    }
    determineBiometricPriority(data) {
        if (data.heartRateBpm > 180 || data.adrenalineIndex > 0.9) {
            return 'CRITICAL';
        }
        if (data.heartRateBpm > 140 || data.adrenalineIndex > 0.7) {
            return 'HIGH';
        }
        if (data.heartRateBpm > 100 || data.adrenalineIndex > 0.5) {
            return 'MEDIUM';
        }
        return 'LOW';
    }
    determineSpatialPriority(data) {
        // Check for threats in detected objects
        const threats = data.detectedObjects.filter(obj => obj.label.toLowerCase().includes('threat') ||
            obj.label.toLowerCase().includes('danger') ||
            obj.confidence > 0.9 && obj.distanceMeters < 10);
        if (threats.length > 0) {
            return 'CRITICAL';
        }
        if (data.detectedObjects.some(obj => obj.distanceMeters < 5)) {
            return 'HIGH';
        }
        if (data.detectedObjects.length > 5) {
            return 'MEDIUM';
        }
        return 'LOW';
    }
    broadcastToDevicesWithCapability(capability, event) {
        if (!this.io)
            return;
        this.devices.forEach((device, deviceId) => {
            if (device.capabilities.includes(capability)) {
                this.io?.to(deviceId).emit('telemetry_event', event);
            }
        });
    }
    triggerNeuroAgentProcessing(event) {
        // This will be connected to the neuro-agent system
        console.log(`[EVIE] Triggering neuro-agent processing for ${event.eventType}`);
        // Emit to AI processing system
        this.io?.emit('neuro_agent_trigger', {
            eventType: event.eventType,
            priority: event.priority,
            data: event.payload
        });
    }
    triggerThreatAssessment(spatialData) {
        console.log('[EVIE] Triggering threat assessment');
        // This will be connected to spatial perception AI
        const threats = spatialData.detectedObjects.filter(obj => obj.label.toLowerCase().includes('threat') ||
            obj.label.toLowerCase().includes('danger'));
        if (threats.length > 0) {
            const alertEvent = {
                eventType: 'HUD_STATE_MUTATION',
                timestamp: new Date().toISOString(),
                priority: 'CRITICAL',
                payload: {
                    alertBox: {
                        visible: true,
                        header: 'THREAT DETECTED',
                        body: `${threats.length} potential threat(s) detected in proximity`,
                        colorHex: '#ff3333'
                    }
                }
            };
            this.broadcastToDevicesWithCapability('ar_display', alertEvent);
        }
    }
    updateHUDWidget(params) {
        const updateEvent = {
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: 'MEDIUM',
            payload: params
        };
        this.broadcastToDevicesWithCapability('ar_display', updateEvent);
    }
    triggerAlert(params) {
        const alertEvent = {
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: params.priority || 'HIGH',
            payload: {
                alertBox: {
                    visible: true,
                    header: params.header || 'ALERT',
                    body: params.body || '',
                    colorHex: params.color || '#ffaa00'
                }
            }
        };
        this.broadcastToDevicesWithCapability('ar_display', alertEvent);
    }
    sendSystemStatus(deviceId) {
        const statusEvent = {
            eventType: 'SYSTEM_STATUS',
            timestamp: new Date().toISOString(),
            priority: 'LOW',
            payload: {
                connectedDevices: this.devices.size,
                biometricSamples: this.biometricHistory.length,
                spatialSamples: this.spatialHistory.length,
                systemUptime: process.uptime()
            }
        };
        this.io?.to(deviceId).emit('telemetry_event', statusEvent);
    }
    // Public API for other services to send events
    sendEvent(event) {
        this.broadcastToDevicesWithCapability('ar_display', event);
        this.broadcastToDevicesWithCapability('biometric_display', event);
    }
    getConnectedDevices() {
        return Array.from(this.devices.values());
    }
    getBiometricHistory() {
        return [...this.biometricHistory];
    }
    getSpatialHistory() {
        return [...this.spatialHistory];
    }
}
exports.websocketService = new WebSocketService();
//# sourceMappingURL=websocket.js.map