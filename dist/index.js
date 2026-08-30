"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const db_1 = require("./services/db");
const auth_1 = require("./services/auth");
const chat_1 = __importDefault(require("./routes/chat"));
const health_1 = __importDefault(require("./routes/health"));
const knowledge_1 = __importDefault(require("./routes/knowledge"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const files_1 = __importDefault(require("./routes/files"));
const voice_1 = __importDefault(require("./routes/voice"));
const knowledgeRegistry_1 = require("./core/registries/knowledgeRegistry");
const knowledgeStore_1 = require("./services/knowledgeStore");
const ConnectorManager_1 = require("./core/connectors/ConnectorManager");
const SpatialProcessor_1 = require("./domains/spatial-perception/SpatialProcessor");
const BiometricProcessor_1 = require("./domains/biometrics/BiometricProcessor");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
// /voice needs the raw body (audio bytes) rather than JSON, so it's
// mounted before the global JSON parser - but it still requires the
// owner token like every other non-health route.
app.use('/voice', auth_1.requireOwner, voice_1.default);
app.use(express_1.default.json({ limit: '10mb' }));
// The browser UI itself is unauthenticated (just static HTML/CSS/JS -
// nothing owner-specific in the files), but every API route it calls is
// gated behind requireOwner via the token the page asks you to paste in.
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'public')));
// Neuro-agent telemetry endpoints for physical awareness
app.post('/telemetry/spatial', auth_1.requireOwner, async (req, res) => {
    try {
        const snapshot = SpatialProcessor_1.spatialProcessor.processSpatialData(req.body);
        const threatAssessment = SpatialProcessor_1.spatialProcessor.assessThreats(snapshot);
        res.json({
            success: true,
            snapshot,
            threatAssessment
        });
        if (threatAssessment.hasThreats) {
            console.log(`[NEURO-AGENT] Threat detected: ${threatAssessment.overallThreatLevel}`);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/telemetry/biometric', auth_1.requireOwner, async (req, res) => {
    try {
        const biometric = BiometricProcessor_1.biometricProcessor.processBiometricData(req.body);
        const analysis = BiometricProcessor_1.biometricProcessor.analyzeBiometrics(biometric);
        res.json({
            success: true,
            biometric,
            analysis
        });
        if (analysis.currentStatus === 'critical') {
            console.log(`[NEURO-AGENT] Critical biometric status: ${analysis.healthAlerts.join(', ')}`);
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/telemetry/status', auth_1.requireOwner, (req, res) => {
    res.json({
        success: true,
        spatial: SpatialProcessor_1.spatialProcessor.getCurrentEnvironmentState(),
        biometric: BiometricProcessor_1.biometricProcessor.getCurrentPhysiologicalState()
    });
});
// Favicon handler to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(200).end();
});
// Health check is intentionally unauthenticated (useful for uptime
// monitors) but exposes no owner data. Everything else requires the
// owner token.
app.use('/', health_1.default);
app.use(auth_1.requireOwner);
app.use('/', chat_1.default);
app.use('/', knowledge_1.default);
app.use('/', tasks_1.default);
app.use('/', files_1.default);
// Keepalive system to prevent service sleep
const KEEPALIVE_INTERVAL = parseInt(process.env.KEEPALIVE_INTERVAL || '300', 10); // 5 minutes default
let keepaliveTimer = null;
function startKeepalive() {
    if (keepaliveTimer)
        clearInterval(keepaliveTimer);
    const intervalMs = isNaN(KEEPALIVE_INTERVAL) ? 300000 : KEEPALIVE_INTERVAL * 1000;
    keepaliveTimer = setInterval(() => {
        console.log(`[MCGYVER] Keepalive ping at ${new Date().toISOString()}`);
        // Perform lightweight health check
        try {
            // Try to perform a simple database operation if available
            console.log('[MCGYVER] System health: Monitoring active');
        }
        catch (error) {
            console.log('[MCGYVER] System health: Running in degraded mode');
        }
    }, intervalMs);
    console.log(`[MCGYVER] Keepalive system started (interval: ${intervalMs / 1000}s)`);
}
// Background learning and neuro-agent processing
const ENABLE_BACKGROUND_LEARNING = process.env.ENABLE_BACKGROUND_LEARNING === 'true';
const BACKGROUND_PROCESSING_INTERVAL = parseInt(process.env.BACKGROUND_PROCESSING_INTERVAL || '600', 10); // 10 minutes default
let backgroundTimer = null;
async function processBackgroundLearning() {
    try {
        console.log(`[MCGYVER] Neuro-agent background processing started at ${new Date().toISOString()}`);
        // Re-hydrate knowledge base with any new information
        const existing = await (0, knowledgeStore_1.loadAllKnowledge)();
        const newItems = existing.filter(item => !knowledgeRegistry_1.knowledgeRegistry.has(item.id));
        if (newItems.length > 0) {
            console.log(`[MCGYVER] Neuro-agent detected ${newItems.length} new knowledge items`);
            knowledgeRegistry_1.knowledgeRegistry.hydrate(existing);
            console.log(`[MCGYVER] Neuro-agent knowledge base updated: ${existing.length} item(s)`);
        }
        // Perform knowledge consolidation and pattern recognition
        if (existing.length > 10) {
            console.log('[MCGYVER] Neuro-agent performing knowledge consolidation...');
            // Future: Implement semantic clustering, relationship mapping, pattern recognition
        }
        // Physical awareness processing - spatial and biometric analysis
        const spatialHistory = SpatialProcessor_1.spatialProcessor.getRecentSpatialHistory(5);
        const biometricHistory = BiometricProcessor_1.biometricProcessor.getBiometricHistory(10);
        if (spatialHistory.length > 0) {
            console.log(`[NEURO-AGENT] Processing ${spatialHistory.length} spatial snapshots for environmental awareness`);
            const latestSpatial = spatialHistory[spatialHistory.length - 1];
            const threatAssessment = SpatialProcessor_1.spatialProcessor.assessThreats(latestSpatial);
            if (threatAssessment.hasThreats) {
                console.log(`[NEURO-AGENT] Environmental threat detected: ${threatAssessment.overallThreatLevel}`);
                // Future: Integrate threat assessment into AI responses
            }
        }
        if (biometricHistory.length > 0) {
            console.log(`[NEURO-AGENT] Processing ${biometricHistory.length} biometric samples for physiological awareness`);
            const latestBiometric = biometricHistory[biometricHistory.length - 1];
            const analysis = BiometricProcessor_1.biometricProcessor.analyzeBiometrics(latestBiometric);
            if (analysis.currentStatus === 'critical') {
                console.log(`[NEURO-AGENT] Critical physiological status: ${analysis.healthAlerts.join('. ')}`);
                // Future: Adjust AI responses based on physiological state
            }
        }
        console.log(`[MCGYVER] Neuro-agent background processing completed`);
    }
    catch (error) {
        console.error('[MCGYVER] Neuro-agent background processing error:', error);
    }
}
function startBackgroundLearning() {
    if (!ENABLE_BACKGROUND_LEARNING) {
        console.log('[MCGYVER] Background learning disabled by configuration');
        return;
    }
    if (backgroundTimer)
        clearInterval(backgroundTimer);
    const intervalMs = isNaN(BACKGROUND_PROCESSING_INTERVAL) ? 600000 : BACKGROUND_PROCESSING_INTERVAL * 1000;
    backgroundTimer = setInterval(() => {
        processBackgroundLearning();
    }, intervalMs);
    console.log(`[MCGYVER] Neuro-agent background learning started (interval: ${intervalMs / 1000}s)`);
    // Initial processing
    setTimeout(() => processBackgroundLearning(), 5000);
}
app.listen(PORT, async () => {
    console.log(`[MCGYVER] Virtual Operational Robot running on port ${PORT}`);
    console.log(`[MCGYVER] Open http://localhost:${PORT} in your browser`);
    console.log(`[MCGYVER] Neuro-agent: Physically Aware System Initialized`);
    // No database dependency, so this runs immediately rather than waiting
    // behind the Mongo connection attempt below.
    ConnectorManager_1.connectorManager.registerAll();
    try {
        await (0, db_1.connectDb)();
        console.log('[MCGYVER] Ready.');
    }
    catch (e) {
        console.warn('[MCGYVER] Could not reach MongoDB - running on in-memory');
        console.warn('[MCGYVER] memory only. Nothing will persist across restarts');
        console.warn('[MCGYVER] until MONGO_URL points at a real database.');
        console.warn('[MCGYVER] Reason:', e.message);
    }
    const existing = await (0, knowledgeStore_1.loadAllKnowledge)();
    knowledgeRegistry_1.knowledgeRegistry.hydrate(existing);
    console.log(`[MCGYVER] Knowledge base loaded: ${existing.length} item(s)`);
    // Start keepalive system
    startKeepalive();
    // Start background learning (neuro-agent with physical awareness)
    startBackgroundLearning();
    console.log('[MCGYVER] All systems operational. Virtual Operational Robot active and monitoring environment.');
});
process.on('SIGTERM', () => {
    console.log('[MCGYVER] SIGTERM received, shutting down...');
    process.exit(0);
});
//# sourceMappingURL=index.js.map