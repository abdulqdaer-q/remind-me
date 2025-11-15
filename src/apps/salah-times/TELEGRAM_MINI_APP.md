# Telegram Mini App Integration

This Salah Times app is now fully compatible with Telegram Mini Apps and optimized for mobile devices.

## Features

### Telegram Integration
- ✅ Automatic Telegram WebApp SDK initialization
- ✅ Theme detection (light/dark mode)
- ✅ Automatic language detection from user's Telegram settings
- ✅ Location parameters via start_param
- ✅ Full viewport expansion
- ✅ Safe area support for notched devices

### Mobile Optimizations
- ✅ Responsive design for all screen sizes
- ✅ Touch-optimized UI elements (44px minimum touch targets)
- ✅ Dynamic viewport height (100dvh)
- ✅ iOS bounce prevention
- ✅ Safe area insets for iPhone X and newer
- ✅ Landscape orientation support

## Setting Up the Telegram Mini App

### 1. Build the App

```bash
npm run build
```

### 2. Deploy the Built Files

Deploy the contents of the `dist` folder to your web server or hosting service (e.g., Netlify, Vercel, GitHub Pages).

### 3. Register with BotFather

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newapp` or edit an existing bot with `/myapps`
3. Follow the prompts to set up your Mini App:
   - **Web App URL**: Your deployed app URL (e.g., `https://your-domain.com/salah-times`)
   - **Short name**: A unique identifier (e.g., `salah_times`)
   - **Description**: Brief description of your app
   - **Photo**: Upload an icon (640x360px recommended)

### 4. Usage in Telegram

#### Method 1: Direct Link
Share this link with users:
```
https://t.me/YOUR_BOT_USERNAME/YOUR_APP_SHORT_NAME
```

#### Method 2: With Location Parameters
To pass custom location coordinates, use start parameters:
```
https://t.me/YOUR_BOT_USERNAME/YOUR_APP_SHORT_NAME?startapp=33.5138_36.2765
```

Format: `latitude_longitude` (separated by underscore)

#### Method 3: Bot Command
Create a command in your bot that opens the Mini App with location parameters.

## URL Parameters

The app supports the following query parameters:

- `lat` - Latitude (decimal)
- `lng` - Longitude (decimal)
- `lang` - Language code (en, ar, etc.)

**Example:**
```
https://your-domain.com/salah-times/?lat=33.5138&lng=36.2765&lang=ar
```

## Parameter Priority

The app uses the following priority for parameters:

1. **URL query parameters** (highest priority)
2. **Telegram start_param** for location
3. **Telegram user language** for language
4. **Default values** from config (fallback)

## Theme Support

The app automatically adapts to Telegram's theme:

- **Light Theme**: Uses Telegram's light theme colors
- **Dark Theme**: Uses Telegram's dark theme colors
- **Custom Colors**: Respects Telegram's accent colors

## Development

### Running Locally

```bash
npm run dev
```

Then open the dev URL in your browser. The app will work normally without Telegram WebApp SDK (it gracefully degrades).

### Testing in Telegram

To test in Telegram during development:

1. Use a tool like [ngrok](https://ngrok.com/) to expose your local server
2. Update your bot's Mini App URL to the ngrok URL
3. Open the Mini App in Telegram

### Environment Variables

Create a `.env` file:

```env
VITE_PRAYER_TIMES_SERVICE_URL=http://localhost:3002
VITE_TRANSLATION_SERVICE_URL=http://localhost:3001
```

## API Integration

The app communicates with two microservices:

1. **Prayer Times Service** - Fetches prayer times based on location
2. **Translation Service** - Provides localized prayer names

Ensure these services are running and accessible from your deployed app.

## Browser Compatibility

- iOS Safari 12+
- Android Chrome 80+
- Telegram Desktop (WebView)
- Telegram Mobile (WebView)

## Troubleshooting

### App Not Expanding to Full Height
- Check that the Telegram WebApp SDK is loaded
- Verify `telegramMiniApp.init()` is called
- Check browser console for errors

### Theme Not Applied
- Ensure the app is opened via Telegram (not direct browser)
- Check that theme CSS variables are defined
- Verify the Telegram WebApp SDK is loaded before the app initializes

### Location Not Detected
- Verify start_param format: `latitude_longitude` (e.g., `33.5138_36.2765`)
- Check that the bot command passes the parameter correctly
- Fallback to default location if not provided

## Additional Resources

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [Telegram WebApp SDK](https://core.telegram.org/bots/webapps#initializing-mini-apps)
