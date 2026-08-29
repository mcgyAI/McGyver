"use strict";
// AR HUD Manager for Mc'Gyver + Evie Integration
// Handles futuristic AR interface management, widget rendering, and spatial UI anchoring
Object.defineProperty(exports, "__esModule", { value: true });
exports.arHUDManager = void 0;
const websocket_1 = require("../../services/websocket");
class ARHUDManager {
    activeWidgets = new Map();
    alertHistory = [];
    currentTheme = 'cyber';
    hudOpacity = 0.85;
    // Initialize HUD system
    initialize() {
        console.log('[AR-HUD] Futuristic AR interface system initialized');
        this.loadDefaultWidgets();
    }
    loadDefaultWidgets() {
        // Heart rate monitor
        this.addWidget({
            id: 'heart_rate_monitor',
            type: 'heart_rate',
            position: { x: 0.02, y: 0.02 }, // Top-left corner
            size: { width: 0.25, height: 0.15 },
            priority: 'medium',
            visible: true,
            data: { currentBPM: 0, trend: 'stable' }
        });
        // Threat detection panel
        this.addWidget({
            id: 'threat_detection',
            type: 'threat_detection',
            position: { x: 0.73, y: 0.02 }, // Top-right corner
            size: { width: 0.25, height: 0.20 },
            priority: 'high',
            visible: true,
            data: { threats: [], overallStatus: 'none' }
        });
        // System status
        this.addWidget({
            id: 'system_status',
            type: 'system_status',
            position: { x: 0.02, y: 0.85 }, // Bottom-left corner
            size: { width: 0.20, height: 0.12 },
            priority: 'low',
            visible: true,
            data: { uptime: 0, devices: 0, status: 'operational' }
        });
        console.log('[AR-HUD] Default widgets loaded');
    }
    // Add widget to HUD
    addWidget(config) {
        this.activeWidgets.set(config.id, config);
        this.broadcastWidgetUpdate(config);
    }
    // Update widget data
    updateWidget(widgetId, data) {
        const widget = this.activeWidgets.get(widgetId);
        if (widget) {
            widget.data = { ...widget.data, ...data };
            this.broadcastWidgetUpdate(widget);
        }
    }
    // Remove widget
    removeWidget(widgetId) {
        const widget = this.activeWidgets.get(widgetId);
        if (widget) {
            widget.visible = false;
            this.broadcastWidgetUpdate(widget);
            this.activeWidgets.delete(widgetId);
        }
    }
    // Trigger alert
    triggerAlert(config) {
        console.log(`[AR-HUD] Alert triggered: ${config.header} (${config.severity})`);
        // Add to alert history
        this.alertHistory.push({
            ...config,
            duration: config.duration || 5000,
            autoDismiss: config.autoDismiss !== false
        });
        // Create alert widget
        const alertWidget = {
            id: `alert_${Date.now()}`,
            type: 'alert',
            position: { x: 0.5, y: 0.5 }, // Center screen
            size: { width: 0.4, height: 0.3 },
            priority: config.severity === 'critical' ? 'critical' : 'high',
            visible: true,
            data: config
        };
        this.addWidget(alertWidget);
        // Broadcast HUD update
        const hudUpdate = {
            alertBox: {
                visible: true,
                header: config.header,
                body: config.body,
                colorHex: this.getSeverityColor(config.severity)
            }
        };
        websocket_1.websocketService.sendEvent({
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: config.severity === 'critical' ? 'CRITICAL' : 'HIGH',
            payload: hudUpdate
        });
        // Auto-dismiss if configured
        if (config.autoDismiss !== false && config.duration && config.duration > 0) {
            setTimeout(() => {
                this.dismissAlert(alertWidget.id);
            }, config.duration);
        }
    }
    // Dismiss alert
    dismissAlert(alertId) {
        this.removeWidget(alertId);
        // Clear alert box if no more alerts
        const remainingAlerts = Array.from(this.activeWidgets.values())
            .filter(w => w.type === 'alert');
        if (remainingAlerts.length === 0) {
            const hudUpdate = {
                alertBox: {
                    visible: false,
                    header: '',
                    body: '',
                    colorHex: '#00f0ff'
                }
            };
            websocket_1.websocketService.sendEvent({
                eventType: 'HUD_STATE_MUTATION',
                timestamp: new Date().toISOString(),
                priority: 'LOW',
                payload: hudUpdate
            });
        }
    }
    // Update heart rate widget
    updateHeartRate(bpm, trend) {
        this.updateWidget('heart_rate_monitor', {
            currentBPM: bpm,
            trend,
            status: this.getHeartRateStatus(bpm),
            color: this.getHeartRateColor(bpm)
        });
    }
    // Update threat detection widget
    updateThreatDetection(threats, overallStatus) {
        this.updateWidget('threat_detection', {
            threats,
            overallStatus,
            threatCount: threats.length,
            color: this.getThreatColor(overallStatus)
        });
    }
    // Update system status widget
    updateSystemStatus(uptime, devices, status) {
        this.updateWidget('system_status', {
            uptime,
            devices,
            status,
            color: status === 'operational' ? '#00ff88' : '#ffaa00'
        });
    }
    // Spatial UI anchoring
    anchorToRealWorld(anchorPoints) {
        console.log('[AR-HUD] Anchoring UI to real-world coordinates:', anchorPoints);
        // Broadcast anchor update to AR devices
        websocket_1.websocketService.sendEvent({
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: 'MEDIUM',
            payload: {
                spatialAnchors: anchorPoints,
                action: 'update_anchors'
            }
        });
    }
    // Generate HUD HTML for rendering
    generateHUDHTML() {
        let html = `
      <div class="ar-hud-container" style="opacity: ${this.hudOpacity}">
        <div class="scanlines"></div>
        <div class="hud-frame">
    `;
        // Render all visible widgets
        this.activeWidgets.forEach(widget => {
            if (widget.visible) {
                html += this.renderWidget(widget);
            }
        });
        html += `
        </div>
      </div>
    `;
        return html;
    }
    renderWidget(widget) {
        const style = `
      position: absolute;
      left: ${widget.position.x * 100}%;
      top: ${widget.position.y * 100}%;
      width: ${widget.size.width * 100}%;
      height: ${widget.size.height * 100}%;
      z-index: ${this.getPriorityZIndex(widget.priority)};
    `;
        switch (widget.type) {
            case 'heart_rate':
                return this.renderHeartRateWidget(widget, style);
            case 'threat_detection':
                return this.renderThreatWidget(widget, style);
            case 'system_status':
                return this.renderSystemStatusWidget(widget, style);
            case 'alert':
                return this.renderAlertWidget(widget, style);
            default:
                return '';
        }
    }
    renderHeartRateWidget(widget, style) {
        const data = widget.data;
        const color = data.color || '#00f0ff';
        return `
      <div class="hud-widget heart-rate" style="${style}">
        <div class="widget-label">HEART RATE</div>
        <div class="widget-value" style="color: ${color}">
          ${data.currentBPM || '--'} BPM
        </div>
        <div class="widget-trend ${data.trend || 'stable'}">
          ${data.trend ? data.trend.toUpperCase() : 'STABLE'}
        </div>
        <div class="widget-graph">
          ${this.generateHeartRateGraph(data.currentBPM, data.trend)}
        </div>
      </div>
    `;
    }
    renderThreatWidget(widget, style) {
        const data = widget.data;
        const color = data.color || '#00f0ff';
        const threatsHTML = (data.threats || []).map((threat) => `
      <div class="threat-item ${threat.severity || 'low'}">
        <div class="threat-icon">${this.getThreatIcon(threat.type)}</div>
        <div class="threat-info">
          <div class="threat-type">${threat.type || 'Unknown'}</div>
          <div class="threat-distance">${threat.distance ? threat.distance + 'm' : '--'}</div>
        </div>
      </div>
    `).join('');
        return `
      <div class="hud-widget threat-detection" style="${style}">
        <div class="widget-label">THREAT ANALYSIS</div>
        <div class="widget-status" style="color: ${color}">
          ${data.overallStatus?.toUpperCase() || 'SCANNING'}
        </div>
        <div class="threat-list">
          ${threatsHTML || '<div class="no-threats">No threats detected</div>'}
        </div>
      </div>
    `;
    }
    renderSystemStatusWidget(widget, style) {
        const data = widget.data;
        const color = data.color || '#00ff88';
        return `
      <div class="hud-widget system-status" style="${style}">
        <div class="widget-label">SYSTEM STATUS</div>
        <div class="widget-status" style="color: ${color}">
          ${data.status?.toUpperCase() || 'OPERATIONAL'}
        </div>
        <div class="widget-metrics">
          <div class="metric">
            <span class="metric-label">UPTIME:</span>
            <span class="metric-value">${this.formatUptime(data.uptime || 0)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">DEVICES:</span>
            <span class="metric-value">${data.devices || 0}</span>
          </div>
        </div>
      </div>
    `;
    }
    renderAlertWidget(widget, style) {
        const data = widget.data;
        const color = this.getSeverityColor(data.severity);
        return `
      <div class="hud-widget alert" style="${style}; border-color: ${color}">
        <div class="alert-header" style="color: ${color}">
          ${data.header?.toUpperCase() || 'ALERT'}
        </div>
        <div class="alert-body">
          ${data.body || ''}
        </div>
        <div class="alert-dismiss" onclick="dismissAlert('${widget.id}')">
          DISMISS
        </div>
      </div>
    `;
    }
    generateHeartRateGraph(bpm, trend) {
        // Simple SVG graph visualization
        const points = [];
        const baseline = 70;
        const currentHeight = Math.min(100, (bpm / 180) * 100);
        for (let i = 0; i < 20; i++) {
            const x = (i / 19) * 100;
            const variation = Math.sin(i * 0.5) * 10;
            const y = 50 + variation + (i === 19 ? (currentHeight - 50) : 0);
            points.push(`${x},${y}`);
        }
        return `
      <svg viewBox="0 0 100 50" class="heart-rate-graph">
        <polyline
          points="${points.join(' ')}"
          fill="none"
          stroke="${this.getHeartRateColor(bpm)}"
          stroke-width="2"
        />
        <circle cx="100" cy="${50 + Math.sin(19 * 0.5) * 10 + (currentHeight - 50)}" r="3" fill="${this.getHeartRateColor(bpm)}" />
      </svg>
    `;
    }
    getPriorityZIndex(priority) {
        switch (priority) {
            case 'critical': return 1000;
            case 'high': return 800;
            case 'medium': return 600;
            case 'low': return 400;
            default: return 500;
        }
    }
    getHeartRateStatus(bpm) {
        if (bpm > 180)
            return 'CRITICAL';
        if (bpm > 150)
            return 'VERY HIGH';
        if (bpm > 120)
            return 'ELEVATED';
        if (bpm > 100)
            return 'HIGH';
        if (bpm < 60)
            return 'LOW';
        return 'NORMAL';
    }
    getHeartRateColor(bpm) {
        if (bpm > 180)
            return '#ff3333';
        if (bpm > 150)
            return '#ff6633';
        if (bpm > 120)
            return '#ffaa00';
        if (bpm > 100)
            return '#ffcc00';
        if (bpm < 60)
            return '#00aaff';
        return '#00ff88';
    }
    getThreatColor(status) {
        switch (status?.toLowerCase()) {
            case 'critical': return '#ff3333';
            case 'high': return '#ff6633';
            case 'medium': return '#ffaa00';
            case 'low': return '#ffcc00';
            default: return '#00f0ff';
        }
    }
    getThreatIcon(type) {
        const icons = {
            'hostile': '⚠️',
            'threat': '⚡',
            'danger': '☢️',
            'weapon': '🔫',
            'fire': '🔥',
            'proximity': '📍',
            'unknown': '❓'
        };
        return icons[type.toLowerCase()] || '⚠️';
    }
    getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return '#ff3333';
            case 'warning': return '#ffaa00';
            case 'info': return '#00f0ff';
            default: return '#00f0ff';
        }
    }
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
    broadcastWidgetUpdate(widget) {
        const updateEvent = {
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: widget.priority === 'critical' ? 'CRITICAL' : 'MEDIUM',
            payload: {
                widget: {
                    id: widget.id,
                    type: widget.type,
                    visible: widget.visible,
                    data: widget.data
                }
            }
        };
        websocket_1.websocketService.sendEvent(updateEvent);
    }
    // Set HUD theme
    setTheme(theme) {
        this.currentTheme = theme;
        console.log(`[AR-HUD] Theme changed to: ${theme}`);
        // Broadcast theme change
        websocket_1.websocketService.sendEvent({
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: 'LOW',
            payload: { theme, action: 'change_theme' }
        });
    }
    // Set HUD opacity
    setOpacity(opacity) {
        this.hudOpacity = Math.max(0.1, Math.min(1.0, opacity));
        websocket_1.websocketService.sendEvent({
            eventType: 'HUD_STATE_MUTATION',
            timestamp: new Date().toISOString(),
            priority: 'LOW',
            payload: { opacity: this.hudOpacity, action: 'set_opacity' }
        });
    }
    // Get active widgets
    getActiveWidgets() {
        return Array.from(this.activeWidgets.values());
    }
    // Get alert history
    getAlertHistory() {
        return [...this.alertHistory];
    }
}
exports.arHUDManager = new ARHUDManager();
//# sourceMappingURL=ARHUDManager.js.map