import { cleanEnv, str, port, url } from 'envalid';
import dotenv from 'dotenv';
dotenv.config();

export const env = cleanEnv(process.env, {
  PORT: port({ default: 5000 }),
  MONGO_URI: str(),
  GEMINI_API_KEY: str(),
  GROQ_API_KEY: str({ default: '' }), // optional fallback
  YOUTUBE_API_KEY: str(),
  REDIS_URL: str(),
    NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'], default: 'development' })
});
