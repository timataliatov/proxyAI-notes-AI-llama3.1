import ErrorResponse from '../utils/ErrorResponse.js';

export default function validateMode(req, res, next) {
  const mode = req.headers['mode'];

  if (!mode) {
    return res.status(400).json({ error: 'Mode is required' });
  }

  const validModes = ['production', 'development']; // Update with your valid modes
  if (!validModes.includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  req.mode = mode;
  console.log(`Mode: ${mode}`);
  next();
}
