# Phase 4 - Voice-first control

Goal: a voice interface on top of everything built in Phases 0-3 - NOT a
replacement for them. Voice should be the thinnest possible layer: STT in,
same Router, TTS out.

Build order:
1. Add an STT provider (Deepgram is a reasonable default - same one Mc'Gy
   already uses, so you know its behavior).
2. Add a TTS provider (ElevenLabs for quality, OpenAI TTS as a cheaper
   fallback).
3. Wire both into a single `/voice` route that: audio in -> STT -> the
   SAME `route()` function `/chat` uses -> TTS -> audio out. Resist the
   urge to build a separate reasoning path for voice; it should be
   indistinguishable from text under the hood.
4. Wake-word/always-listening is a client concern (mobile/desktop app),
   not something this backend needs to know about - it just needs a
   request boundary (start/stop of one utterance).
