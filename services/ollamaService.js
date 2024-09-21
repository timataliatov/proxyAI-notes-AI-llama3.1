import fetch from 'node-fetch';
import { PassThrough } from 'stream';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_API_URL = `${OLLAMA_HOST}/api`;

export async function generateText(prompt, model = 'llama3.1', stream = false) {
  console.log(`Sending request to Ollama API: ${OLLAMA_API_URL}/generate`);
  console.log(`Model: ${model}, Prompt: ${prompt.substring(0, 100)}..., Stream: ${stream}`);

  const response = await fetch(`${OLLAMA_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      stream,
    }),
  });

  if (!response.ok) {
    console.error(`Ollama API request failed with status ${response.status}`);
    console.error(`Response text: ${await response.text()}`);
    throw new Error(`Ollama API request failed with status ${response.status}`);
  }

  if (stream) {
    const passThrough = new PassThrough();
    response.body.on('data', (chunk) => {
      passThrough.write(chunk);
    });
    response.body.on('end', () => {
      passThrough.end();
    });
    return passThrough;
  } else {
    const data = await response.json();
    return data.response;
  }
}

export async function generateImage(prompt, width = 512, height = 512) {
  // This is a placeholder. Ollama doesn't support image generation directly.
  // You might want to use a different local solution for image generation.
  throw new Error('Image generation not implemented for local LLM');
}

export async function textToSpeech(text) {
  // This is a placeholder. Ollama doesn't support text-to-speech directly.
  // You might want to use a different local solution for text-to-speech.
  throw new Error('Text-to-speech not implemented for local LLM');
}
