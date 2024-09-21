import express from 'express';
import cors from 'cors';
import { validateProvider } from './middlewares/validateProvider.js';
import validateMode from './middlewares/validateMode.js';
import chatRouter from './routers/chatRouter.js';
import imageRouter from './routers/imageRouter.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
const port = process.env.PORT || 5050;

app.use(cors({
  origin: '*',  // Be more specific in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'provider', 'mode'],
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`\n${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // Capture the original json function
  const originalJson = res.json;

  // Override the json function
  res.json = function(body) {
    console.log(`Response (${res.statusCode}):`);
    console.log(body);

    // Call the original json function
    return originalJson.call(this, body);
  }

  next();
});

// Apply the middlewares globally
app.use(validateProvider);
app.use(validateMode);

// Use the chat router for the /chat/completions endpoint
app.use('/chat/completions', chatRouter);

// Use the image router for the /images/generations endpoint
app.use('/images/generations', imageRouter);

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
