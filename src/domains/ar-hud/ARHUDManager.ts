// AR HUD Manager for Mc'Gyver + Evie Integration
// Handles futuristic AR interface management, widget rendering, and spatial UI anchoring

import { websocketService, TelemetryEvent, HUDUpdate } from '../../services/websocket';
import { BiometricData } from '../biometrics/BiometricProcessor';
import { SpatialData } from '../spatial-perception/SpatialProcessor';

export interface WidgetConfig {
  id: string;
  type: 'heart_rate' | 'threat_detection' | 'spatial_map' | 'system_status' | 'alert';
  position: { x: number; y: number };
  size: { width: number; height: number };
  priority: 'low' | 'medium' | 'high' | 'critical';
  visible: boolean;
  data: any;
}

export interface AlertConfig {
  header: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  duration?: number; // milliseconds, 0 for persistent
  autoDismiss?: boolean;
}

export interface UIAnchorPoints {
  primary: { x: number; y: number; z: number };
  secondary?: { x: number; y: number; z: number };
  tertiary?: { x: number; y: number; z: number };
}

class ARHUDManager {
  private activeWidgets: Map<string, WidgetConfig> = new Map();
  private alertHistory: AlertConfig[] = [];
  private currentTheme: 'cyber' | 'tactical' | 'minimal' = 'cyber';
  private hudOpacity: number = 0.85;

  // Initialize HUD system
  initialize(): void {
    console.log('[AR-HUD] Futuristic AR interface system initialized');
    this.loadDefaultWidgets();
  }

  private loadDefaultWidgets(): void {
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
  addWidget(config: WidgetConfig): void {
    this.activeWidgets.set(config.id, config);
    this.broadcastWidgetUpdate(config);
  }

  // Update widget data
  updateWidget(widgetId: string, data: any): void {
    const widget = this.activeWidgets.get(widgetId);
    if (widget) {
      widget.data = { ...widget.data, ...data };
      this.broadcastWidgetUpdate(widget);
    }
  }

  // Remove widget
  removeWidget(widgetId: string): void {
    const widget = this.activeWidgets.get(widgetId);
    if (widget) {
      widget.visible = false;
      this.broadcastWidgetUpdate(widget);
      this.activeWidgets.delete(widgetId);
    }
  }

  // Trigger alert
  triggerAlert(config: AlertConfig): void {
    console.log(`[AR-HUD] Alert triggered: ${config.header} (${config.severity})`);

    // Add to alert history
    this.alertHistory.push({
      ...config,
      duration: config.duration || 5000,
      autoDismiss: config.autoDismiss !== false
    });

    // Create alert widget
    const alertWidget: WidgetConfig = {
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
    const hudUpdate: HUDUpdate = {
      alertBox: {
        visible: true,
        header: config.header,
        body: config.body,
        colorHex: this.getSeverityColor(config.severity)
      }
    };

    websocketService.sendEvent({
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
  dismissAlert(alertId: string): void {
    this.removeWidget(alertId);
    
    // Clear alert box if no more alerts
    const remainingAlerts = Array.from(this.activeWidgets.values())
      .filter(w => w.type === 'alert');
    
    if (remainingAlerts.length === 0) {
      const hudUpdate: HUDUpdate = {
        alertBox: {
          visible: false,
          header: '',
          body: '',
          colorHex: '#00f0ff'
        }
      };

      websocketService.sendEvent({
        eventType: 'HUD_STATE_MUTATION',
        timestamp: new Date().toISOString(),
        priority: 'LOW',
        payload: hudUpdate
      });
    }
  }

  // Update heart rate widget
  updateHeartRate(bpm: number, trend: 'stable' | 'rising' | 'falling' | 'irregular'): void {
    this.updateWidget('heart_rate_monitor', {
      currentBPM: bpm,
      trend,
      status: this.getHeartRateStatus(bpm),
      color: this.getHeartRateColor(bpm)
    });
  }

  // Update threat detection widget
  updateThreatDetection(threats: any[], overallStatus: string): void {
    this.updateWidget('threat_detection', {
      threats,
      overallStatus,
      threatCount: threats.length,
      color: this.getThreatColor(overallStatus)
    });
  }

  // Update system status widget
  updateSystemStatus(uptime: number, devices: number, status: string): void {
    this.updateWidget('system_status', {
      uptime,
      devices,
      status,
      color: status === 'operational' ? '#00ff88' : '#ffaa00'
    });
  }

  // Spatial UI anchoring
  anchorToRealWorld(anchorPoints: UIAnchorPoints): void {
    console.log('[AR-HUD] Anchoring UI to real-world coordinates:', anchorPoints);
    
    // Broadcast anchor update to AR devices
    websocketService.sendEvent({
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
  generateHUDHTML(): string {
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

  private renderWidget(widget: WidgetConfig): string {
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

  private renderHeartRateWidget(widget: WidgetConfig, style: string): string {
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

  private renderThreatWidget(widget: WidgetConfig, style: string): string {
    const data = widget.data;
    const color = data.color || '#00f0ff';
    
    const threatsHTML = (data.threats || []).map((threat: any) => `
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

  private renderSystemStatusWidget(widget: WidgetConfig, style: string): string {
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

  private renderAlertWidget(widget: WidgetConfig, style: string): string {
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

  private generateHeartRateGraph(bpm: number, trend: string): string {
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

  private getPriorityZIndex(priority: string): number {
    switch (priority) {
      case 'critical': return 1000;
      case 'high': return 800;
      case 'medium': return 600;
      case 'low': return 400;
      default: return 500;
    }
  }

  private getHeartRateStatus(bpm: number): string {
    if (bpm > 180) return 'CRITICAL';
    if (bpm > 150) return 'VERY HIGH';
    if (bpm > 120) return 'ELEVATED';
    if (bpm > 100) return 'HIGH';
    if (bpm < 60) return 'LOW';
    return 'NORMAL';
  }

  private getHeartRateColor(bpm: number): string {
    if (bpm > 180) return '#ff3333';
    if (bpm > 150) return '#ff6633';
    if (bpm > 120) return '#ffaa00';
    if (bpm > 100) return '#ffcc00';
    if (bpm < 60) return '#00aaff';
    return '#00ff88';
  }

  private getThreatColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'critical': return '#ff3333';
      case 'high': return '#ff6633';
      case 'medium': return '#ffaa00';
      case 'low': return '#ffcc00';
      default: return '#00f0ff';
    }
  }

  private getThreatIcon(type: string): string {
    const icons: Record<string, string> = {
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

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ff3333';
      case 'warning': return '#ffaa00';
      case 'info': return '#00f0ff';
      default: return '#00f0ff';
    }
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  private broadcastWidgetUpdate(widget: WidgetConfig): void {
    const updateEvent: TelemetryEvent = {
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

    websocketService.sendEvent(updateEvent);
  }

  // Set HUD theme
  setTheme(theme: 'cyber' | 'tactical' | 'minimal'): void {
    this.currentTheme = theme;
    console.log(`[AR-HUD] Theme changed to: ${theme}`);
    
    // Broadcast theme change
    websocketService.sendEvent({
      eventType: 'HUD_STATE_MUTATION',
      timestamp: new Date().toISOString(),
      priority: 'LOW',
      payload: { theme, action: 'change_theme' }
    });
  }

  // Set HUD opacity
  setOpacity(opacity: number): void {
    this.hudOpacity = Math.max(0.1, Math.min(1.0, opacity));
    
    websocketService.sendEvent({
      eventType: 'HUD_STATE_MUTATION',
      timestamp: new Date().toISOString(),
      priority: 'LOW',
      payload: { opacity: this.hudOpacity, action: 'set_opacity' }
    });
  }

  // Get active widgets
  getActiveWidgets(): WidgetConfig[] {
    return Array.from(this.activeWidgets.values());
  }

  // Get alert history
  getAlertHistory(): AlertConfig[] {
    return [...this.alertHistory];
  }
}

export const arHUDManager = new ARHUDManager();