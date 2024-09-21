import { Router } from 'express';
import OpenAI from 'openai';
import OpenAIMock from '../utils/OpenAIMock.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as ollamaService from '../services/ollamaService.js';

const imageRouter = Router();

imageRouter.post('/', asyncHandler(async (req, res) => {
  const { mode, provider } = req;
  const { prompt, size } = req.body;

  let image;

  if (provider === 'ollama' || mode === 'development') {
    try {
      const [width, height] = size.split('x').map(Number);
      image = await ollamaService.generateImage(prompt, width, height);
    } catch (error) {
      console.error('Error generating image locally:', error.message);
      res.status(501).json({ error: 'Image generation not implemented for local LLM' });
      return;
    }
  } else if (provider === 'open-ai' && mode === 'production') {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_APIKEY });
    const response = await openai.images.generate(req.body);
    image = response.data[0];
  } else {
    const openaiMock = new OpenAIMock();
    const response = await openaiMock.images.generate(req.body);
    image = response.data[0];
  }

  res.status(200).json({ data: [image] });
}));

export default imageRouter;
