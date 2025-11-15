import { load } from 'ts-dotenv';

export const settings = load({
  BOT_TOKEN: String,
  WEB_APP_URL: String,
  // Optional: For voice chat streaming
  API_ID: {
    type: Number,
    optional: true,
  },
  API_HASH: {
    type: String,
    optional: true,
  },
  SESSION_STRING: {
    type: String,
    optional: true,
  },
});
