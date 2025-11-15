import { load } from 'ts-dotenv';

export const settings = load({
  BOT_TOKEN: String,
  WEB_APP_URL: String,
  // Voice chat service (Python Pyrogram microservice)
  VOICE_CHAT_SERVICE_URL: {
    type: String,
    optional: true,
    default: 'localhost:50053',
  },
  // For Python voice chat service
  API_ID: {
    type: Number,
    optional: true,
  },
  API_HASH: {
    type: String,
    optional: true,
  },
});
