import ErrorResponse from '../utils/ErrorResponse.js';

export function validateProvider(req, res, next) {
  const provider = req.headers['provider'];

  if (!provider) {
    return res.status(400).json({ error: 'Provider is required' });
  }

  const validProviders = ['open-ai', 'anthropic', 'ollama']; // Added 'ollama' to valid providers
  if (!validProviders.includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  req.provider = provider;
  console.log(`Provider: ${provider}`);
  next();
}
