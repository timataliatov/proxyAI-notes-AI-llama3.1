import { Router } from 'express';
import OpenAI from 'openai';
import OpenAIMock from '../utils/OpenAIMock.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as ollamaService from '../services/ollamaService.js';

const audioRouter = Router();

audioRouter.post('/', asyncHandler(async (req, res) => {
  const { mode, provider } = req;
  const { input, voice } = req.body;

  let audioStream;

  if (provider === 'ollama' || mode === 'development') {
    try {
      audioStream = await ollamaService.textToSpeech(input);
    } catch (error) {
      console.error('Error generating audio locally:', error.message);
      res.status(501).json({ error: 'Text-to-speech not implemented for local LLM' });
      return;
    }
  } else if (provider === 'open-ai' && mode === 'production') {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_APIKEY });
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input,
    });
    audioStream = response.body;
  } else {
    const openaiMock = new OpenAIMock();
    const response = await openaiMock.audio.speech.create({
      model: 'tts-1',
      voice,
      input,
    });
    audioStream = response.body;
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  audioStream.pipe(res);
}));

export default audioRouter;
