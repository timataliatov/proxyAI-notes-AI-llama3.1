import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';
import ErrorResponse from './ErrorResponse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class StreamMock {
  constructor(content) {
    this.chunks = this.splitIntoChunks(content, 1); // Split into chunks of ~5 words each
    this.iterator = this[Symbol.asyncIterator];
    this.controller = new AbortController();
  }

  splitIntoChunks(str, wordsPerChunk) {
    const words = str.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
    }
    return chunks;
  }

  async *[Symbol.asyncIterator]() {
    for (let [i, chunk] of this.chunks.entries()) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.controller.signal.aborted) {
        break;
      }
      yield {
        id: 'chatcmpl-UNIQUEID',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-3.5-mock',
        system_fingerprint: 'fp_c2295e73ad',
        choices: [
          {
            index: 0,
            delta: { content: chunk + (i < this.chunks.length - 1 ? ' ' : '') },
            logprobs: null,
            finish_reason: i === this.chunks.length - 1 ? 'stop' : null
          }
        ]
      };
    }
  }
}

class ChatMock {
  completions = {
    create: async ({ stream, messages }) => {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      const mockResponses = [
        "This is a mock response from the OpenAI API. I'm here to assist you with any questions or tasks you might have.",
        "As an AI language model, I don't have personal experiences, but I can provide information on a wide range of topics.",
        "I'm sorry, but I don't have access to real-time information. Is there anything else I can help you with based on my training data?",
        `You asked about "${lastUserMessage}". While I don't have specific information about that, I can try to provide general knowledge on related topics.`,
        "That's an interesting question! Let me provide some general information that might be helpful in addressing your query.",
        "I don't have personal opinions, but I can give you information based on what I've been trained on.",
        "If you're looking for specifics, I can provide general knowledge or guidance on the topic.",
        "Here's a general overview of the topic you're asking about. If you need more details, just let me know!",
        "I can help with information on many subjects. What would you like to know more about?",
        "I'm here to provide assistance and information based on a broad range of topics.",
        `Based on your question about "${lastUserMessage}", here's some relevant information you might find useful.`,
        "If you have any specific questions, feel free to ask! I'm here to help.",
        "While I can't access current events, I can share insights from my training data on a variety of subjects.",
        "Let me offer some context or general information related to your query.",
        "I'm designed to assist with a wide array of topics. How can I help you today?",
        "I don't have personal experiences, but I can offer information and advice based on extensive training.",
        "For questions about current events, I can provide background information based on past data.",
        "Your question about '${lastUserMessage}' is intriguing. Here's a broad answer that might help.",
        "I'm here to provide information and support based on a large dataset of knowledge.",
        "For detailed or specific questions, I'll do my best to offer comprehensive answers based on my training.",
        "Feel free to ask about any topic! I can provide general information and assistance.",
        "I can offer insights and information on a variety of subjects. What would you like to learn about?",
        "If you're looking for general knowledge, I can certainly provide that. What topic interests you?",
        "I'm here to offer assistance and share information based on what I’ve been trained on.",
        "For detailed inquiries, I'll provide as much relevant information as I can.",
        "Based on your question, I'll provide a general overview that might be helpful.",
        "If you need specific information or guidance, I'm here to assist with that.",
        "I can offer information and advice on many topics. What do you need help with today?",
        "I aim to assist with any questions you have by providing accurate and useful information.",
        "Let me know if you need more details or a different perspective on your question.",
        "I’m here to help with information and advice based on a wide range of topics.",
        "Feel free to ask anything! I’m here to provide helpful and relevant information."
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      if (stream) {
        return new StreamMock(randomResponse);
      } else {
        return {
          id: 'chatcmpl-mock',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-3.5-turbo-mock',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: randomResponse
              },
              finish_reason: 'stop'
            }
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
        };
      }
    }
  };
}

class ImageMock {
  async generate({ ...request }) {
    const { size, response_format, prompt, ...rest } = request;
    let width = 1024;
    let height = 1024;
    if (size) {
      const [w, h] = size.split('x');
      width = parseInt(w);
      height = parseInt(h);
    }
    const data = [
      {
        revised_prompt: prompt
      }
    ];
    const url = `https://placedog.net/${width}/${height}?r`;
    if (response_format === 'b64_json') {
      const res = await fetch(`https://placedog.net/${width}/${height}?r`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      data[0].b64_json = base64;
      return { data };
    }
    data[0].url = url;
    return { data };
  }
}

class AudioMock {
  speech = {
    async create() {
      const filePath = join(__dirname, '../rr.mp3');
      const rr = await readFile(filePath);
      const passThrough = new PassThrough();
      passThrough.write(rr);
      passThrough.end();
      return { body: passThrough };
    }
  };
}

class OpenAIMock {
  constructor() {
    this.chat = new ChatMock();
    this.images = new ImageMock();
    this.audio = new AudioMock();
  }
}

export default OpenAIMock;
