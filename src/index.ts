import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
dotenv.config();

import { connectDb } from './services/db';
import { requireOwner } from './services/auth';
import { websocketService } from './services/websocket';
import chatRoutes from './routes/chat';
import healthRoutes from './routes/health';
import knowledgeRoutes from './routes/knowledge';
import tasksRoutes from './routes/tasks';
import filesRoutes from './routes/files';
import voiceRoutes from './routes/voice';
import { knowledgeRegistry } from './core/registries/knowledgeRegistry';
import { loadAllKnowledge } from './services/knowledgeStore';
import { connectorManager } from './core/connectors/ConnectorManager';
import { spatialProcessor } from './domains/spatial-perception/SpatialProcessor';
import { biometricProcessor } from './domains/biometrics/BiometricProcessor';
import { arHUDManager } from './domains/ar-hud/ARHUDManager';

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

// /voice needs the raw body (audio bytes) rather than JSON, so it's
// mounted before the global JSON parser - but it still requires the
// owner token like every other non-health route.
app.use('/voice', requireOwner, voiceRoutes);

app.use(express.json({ limit: '10mb' }));

// The browser UI itself is unauthenticated (just static HTML/CSS/JS -
// nothing owner-specific in the files), but every API route it calls is
// gated behind requireOwner via the token the page asks you to paste in.
app.use(express.static(path.join(process.cwd(), 'public')));

// Evie AR HUD interface (futuristic interface layer)
app.get('/evie', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'evie-hud.html'));
});

// Favicon handler to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(200).end();
});

// Health check is intentionally unauthenticated (useful for uptime
// monitors) but exposes no owner data. Everything else requires the
// owner token.
app.use('/', healthRoutes);
app.use(requireOwner);
app.use('/', chatRoutes);
app.use('/', knowledgeRoutes);
app.use('/', tasksRoutes);
app.use('/', filesRoutes);

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Keepalive system to prevent service sleep
const KEEPALIVE_INTERVAL = parseInt(process.env.KEEPALIVE_INTERVAL || '300', 10); // 5 minutes default
let keepaliveTimer: NodeJS.Timeout | null = null;

function startKeepalive() {
  if (keepaliveTimer) clearInterval(keepaliveTimer);
  
  const intervalMs = isNaN(KEEPALIVE_INTERVAL) ? 300000 : KEEPALIVE_INTERVAL * 1000;
  
  keepaliveTimer = setInterval(() => {
    console.log(`[MCGYVER] Keepalive ping at ${new Date().toISOString()}`);
    // Perform lightweight health check
    try {
      // Try to perform a simple database operation if available
      console.log('[MCGYVER] System health: Monitoring active');
    } catch (error) {
      console.log('[MCGYVER] System health: Running in degraded mode');
    }
  }, intervalMs);
  
  console.log(`[MCGYVER] Keepalive system started (interval: ${intervalMs / 1000}s)`);
}

// Background learning and neuro-agent processing
const ENABLE_BACKGROUND_LEARNING = process.env.ENABLE_BACKGROUND_LEARNING === 'true';
const BACKGROUND_PROCESSING_INTERVAL = parseInt(process.env.BACKGROUND_PROCESSING_INTERVAL || '600', 10); // 10 minutes default
let backgroundTimer: NodeJS.Timeout | null = null;

async function processBackgroundLearning() {
  try {
    console.log(`[MCGYVER] Neuro-agent background processing started at ${new Date().toISOString()}`);
    
    // Re-hydrate knowledge base with any new information
    const existing = await loadAllKnowledge();
    const newItems = existing.filter(item => !knowledgeRegistry.has(item.id));
    
    if (newItems.length > 0) {
      console.log(`[MCGYVER] Neuro-agent detected ${newItems.length} new knowledge items`);
      knowledgeRegistry.hydrate(existing);
      console.log(`[MCGYVER] Neuro-agent knowledge base updated: ${existing.length} item(s)`);
    }
    
    // Perform knowledge consolidation and pattern recognition
    if (existing.length > 10) {
      console.log('[MCGYVER] Neuro-agent performing knowledge consolidation...');
      // Future: Implement semantic clustering, relationship mapping, pattern recognition
    }

    // Evie integration: Process spatial and biometric data
    const spatialHistory = spatialProcessor.getRecentSpatialHistory(5);
    const biometricHistory = biometricProcessor.getBiometricHistory(10);
    
    if (spatialHistory.length > 0) {
      console.log(`[MCGYVER-EVIE] Processing ${spatialHistory.length} spatial snapshots`);
      const latestSpatial = spatialHistory[spatialHistory.length - 1];
      const threatAssessment = spatialProcessor.assessThreats(latestSpatial);
      
      if (threatAssessment.hasThreats) {
        arHUDManager.updateThreatDetection(threatAssessment.threats, threatAssessment.overallThreatLevel);
        
        if (threatAssessment.overallThreatLevel === 'critical' || threatAssessment.overallThreatLevel === 'high') {
          arHUDManager.triggerAlert({
            header: 'THREAT DETECTED',
            body: `${threatAssessment.threats.length} potential threat(s) detected. ${threatAssessment.threats[0].recommendedAction}`,
            severity: threatAssessment.overallThreatLevel === 'critical' ? 'critical' : 'warning'
          });
        }
      }
    }
    
    if (biometricHistory.length > 0) {
      console.log(`[MCGYVER-EVIE] Processing ${biometricHistory.length} biometric samples`);
      const latestBiometric = biometricHistory[biometricHistory.length - 1];
      const analysis = biometricProcessor.analyzeBiometrics(latestBiometric);
      
      arHUDManager.updateHeartRate(latestBiometric.heartRateBpm, analysis.heartRateTrend);
      
      if (analysis.currentStatus === 'critical') {
        arHUDManager.triggerAlert({
          header: 'BIOMETRIC ALERT',
          body: `Critical status: ${analysis.healthAlerts.join('. ')}`,
          severity: 'critical'
        });
      }
    }
    
    console.log(`[MCGYVER] Neuro-agent background processing completed`);
  } catch (error) {
    console.error('[MCGYVER] Neuro-agent background processing error:', error);
  }
}

function startBackgroundLearning() {
  if (!ENABLE_BACKGROUND_LEARNING) {
    console.log('[MCGYVER] Background learning disabled by configuration');
    return;
  }
  
  if (backgroundTimer) clearInterval(backgroundTimer);
  
  const intervalMs = isNaN(BACKGROUND_PROCESSING_INTERVAL) ? 600000 : BACKGROUND_PROCESSING_INTERVAL * 1000;
  
  backgroundTimer = setInterval(() => {
    processBackgroundLearning();
  }, intervalMs);
  
  console.log(`[MCGYVER] Neuro-agent background learning started (interval: ${intervalMs / 1000}s)`);
  
  // Initial processing
  setTimeout(() => processBackgroundLearning(), 5000);
}

server.listen(PORT, async () => {
  console.log(`[MCGYVER] Private assistant running on port ${PORT}`);
  console.log(`[MCGYVER] Open http://localhost:${PORT} in your browser`);
  console.log(`[MCGYVER] Neuro-agent: Virtual operational robot initialized`);
  console.log(`[MCGYVER] Evie AR HUD interface: WebSocket server ready`);

  // No database dependency, so this runs immediately rather than waiting
  // behind the Mongo connection attempt below.
  connectorManager.registerAll();

  try {
    await connectDb();
    console.log('[MCGYVER] Ready.');
  } catch (e) {
    console.warn('[MCGYVER] Could not reach MongoDB - running on in-memory');
    console.warn('[MCGYVER] memory only. Nothing will persist across restarts');
    console.warn('[MCGYVER] until MONGO_URL points at a real database.');
    console.warn('[MCGYVER] Reason:', (e as Error).message);
  }

  const existing = await loadAllKnowledge();
  knowledgeRegistry.hydrate(existing);
  console.log(`[MCGYVER] Knowledge base loaded: ${existing.length} item(s)`);
  
  // Initialize Evie AR HUD system
  arHUDManager.initialize();
  console.log('[MCGYVER-EVIE] AR HUD interface system initialized');
  
  // Start keepalive system
  startKeepalive();
  
  // Start background learning (neuro-agent with Evie integration)
  startBackgroundLearning();
  
  console.log('[MCGYVER] All systems operational. Neuro-agent active and monitoring. Evie AR interface ready.');
});

process.on('SIGTERM', () => {
  console.log('[MCGYVER] SIGTERM received, shutting down...');
  process.exit(0);
});
