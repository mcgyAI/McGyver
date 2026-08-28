import express, { Router as ExpressRouter } from 'express';
import { route } from '../core/router/Router';
import { loadMemory, saveMemory } from '../services/memory';
import { speechToText, textToSpeech } from '../services/voice';

const router = ExpressRouter();

// Deliberately not a separate reasoning path: audio in -> STT -> the SAME
// route() function /chat uses -> TTS -> audio out. Voice should never
// behave differently from text underneath.
router.post('/', express.raw({ type: '*/*', limit: '15mb' }), async (req, res) => {
  try {
    const mimeType = (req.headers['content-type'] as string) || 'audio/webm';
    const audioBuffer = req.body as Buffer;
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio received' });
    }

    const transcript = await speechToText(audioBuffer, mimeType);
    if (!transcript.trim()) {
      return res.status(400).json({ error: 'Could not transcribe audio - try again' });
    }

    const history = await loadMemory();
    const reply = await route(transcript, history);
    await saveMemory([
      ...history,
      { role: 'user', content: transcript },
      { role: 'assistant', content: reply },
    ]);

    const audioReply = await textToSpeech(reply);

    res.setHeader('X-Transcript', encodeURIComponent(transcript));
    res.setHeader('X-Reply-Text', encodeURIComponent(reply));
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioReply);
  } catch (e) {
    console.error('[MCGYVER] Voice error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
