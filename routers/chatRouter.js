import { Router } from 'express';
import OpenAI from 'openai';
import OpenAIMock from '../utils/OpenAIMock.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as ollamaService from '../services/ollamaService.js';

const chatRouter = Router();

chatRouter.post('/', asyncHandler(async (req, res) => {
  const { stream, model, messages, ...request } = req.body;
  const { mode, provider } = req;

  console.log(`Received request - Mode: ${mode}, Provider: ${provider}, Model: ${model || 'default'}, Stream: ${stream}`);

  const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

  if (provider === 'ollama') {
    console.log('Using Ollama service with LLaMA 3.1 model');
    try {
      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        const ollamaStream = await ollamaService.generateText(prompt, model || 'llama3.1', true);
        ollamaStream.on('data', (chunk) => {
          const data = JSON.parse(chunk);
          if (data.response) {
            res.write(`data: ${JSON.stringify({
              choices: [{
                delta: { content: data.response },
                finish_reason: data.done ? 'stop' : null
              }]
            })}\n\n`);
          }
        });
        ollamaStream.on('end', () => res.end());
      } else {
        const response = await ollamaService.generateText(prompt, model || 'llama3.1');
        console.log('Ollama response received:', response);
        res.json({
          choices: [{
            message: { role: 'assistant', content: response },
            finish_reason: 'stop'
          }]
        });
      }
    } catch (error) {
      console.error('Error from Ollama service:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (provider === 'open-ai' && mode === 'production') {
    console.log('Using OpenAI service');
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_APIKEY });
    try {
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        messages,
        stream,
        ...request
      });
      res.json(completion);
    } catch (error) {
      console.error('Error from OpenAI service:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    console.log('Using mock service');
    const openaiMock = new OpenAIMock();
    const completion = await openaiMock.chat.completions.create({
      model: model || 'gpt-3.5-turbo',
      messages,
      stream,
      ...request
    });
    res.json({ choices: [{ message: { role: 'assistant', content: completion.choices[0].message.content } }] });
  }
}));

export default chatRouter;
