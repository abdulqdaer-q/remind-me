import { load } from 'ts-dotenv';

export const settings = load({
  BOT_TOKEN: String,
  WEB_APP_URL: {
    type: String,
    default: 'https://cdpn.io/pen/debug/QWoNepM',
  },
});
