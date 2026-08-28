"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const Router_1 = require("../core/router/Router");
const memory_1 = require("../services/memory");
const voice_1 = require("../services/voice");
const router = (0, express_1.Router)();
// Deliberately not a separate reasoning path: audio in -> STT -> the SAME
// route() function /chat uses -> TTS -> audio out. Voice should never
// behave differently from text underneath.
router.post('/', express_1.default.raw({ type: '*/*', limit: '15mb' }), async (req, res) => {
    try {
        const mimeType = req.headers['content-type'] || 'audio/webm';
        const audioBuffer = req.body;
        if (!audioBuffer || audioBuffer.length === 0) {
            return res.status(400).json({ error: 'No audio received' });
        }
        const transcript = await (0, voice_1.speechToText)(audioBuffer, mimeType);
        if (!transcript.trim()) {
            return res.status(400).json({ error: 'Could not transcribe audio - try again' });
        }
        const history = await (0, memory_1.loadMemory)();
        const reply = await (0, Router_1.route)(transcript, history);
        await (0, memory_1.saveMemory)([
            ...history,
            { role: 'user', content: transcript },
            { role: 'assistant', content: reply },
        ]);
        const audioReply = await (0, voice_1.textToSpeech)(reply);
        res.setHeader('X-Transcript', encodeURIComponent(transcript));
        res.setHeader('X-Reply-Text', encodeURIComponent(reply));
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioReply);
    }
    catch (e) {
        console.error('[MCGYVER] Voice error:', e);
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=voice.js.map