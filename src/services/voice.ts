// Same provider-swap pattern as llm.ts. STT/TTS providers each implement
// the same shape so changing STT_PROVIDER/TTS_PROVIDER in .env is the
// only thing needed to switch services.

export async function speechToText(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const provider = (process.env.STT_PROVIDER || 'deepgram').toLowerCase();
  switch (provider) {
    case 'deepgram':
      return deepgramSTT(audioBuffer, mimeType);
    case 'openai':
      return openaiSTT(audioBuffer, mimeType);
    default:
      throw new Error(`Unknown STT_PROVIDER: ${provider}`);
  }
}

async function deepgramSTT(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not set');

  const res = await fetch('https://api.deepgram.com/v1/listen?smart_format=true', {
    method: 'POST',
    headers: { Authorization: `Token ${apiKey}`, 'Content-Type': mimeType },
    body: audioBuffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Deepgram error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
}

async function openaiSTT(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp3') ? 'mp3' : 'wav';
  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI STT error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data: any = await res.json();
  return data.text ?? '';
}

export async function textToSpeech(text: string): Promise<Buffer> {
  const provider = (process.env.TTS_PROVIDER || 'elevenlabs').toLowerCase();
  switch (provider) {
    case 'elevenlabs':
      return elevenLabsTTS(text);
    case 'openai':
      return openaiTTS(text);
    default:
      throw new Error(`Unknown TTS_PROVIDER: ${provider}`);
  }
}

async function elevenLabsTTS(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_turbo_v2' }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`ElevenLabs error ${res.status}: ${errText.slice(0, 300)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function openaiTTS(text: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: 'alloy', input: text }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI TTS error ${res.status}: ${errText.slice(0, 300)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
