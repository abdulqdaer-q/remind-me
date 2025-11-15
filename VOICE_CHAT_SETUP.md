# Voice Chat Streaming Setup Guide

This guide explains how to enable voice chat streaming for azan broadcasts in Telegram groups.

## Overview

The reminder system supports two modes for broadcasting azan in groups:
1. **Voice Message** (default) - Sends azan as a voice message (circular audio player)
2. **Voice Chat Streaming** (optional) - Broadcasts azan live in a voice chat

## Current Status

✅ **Voice message broadcasting** is fully implemented and works out of the box
⚠️ **Voice chat streaming** requires additional setup (see below)

## Enabling Voice Chat Streaming

Voice chat streaming uses Telegram's MTProto protocol via GramJS. Follow these steps:

### Step 1: Get Telegram API Credentials

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Click on "API development tools"
4. Create a new application (or use existing one)
5. Note down your `API_ID` and `API_HASH`

### Step 2: Generate Session String

You need to authenticate once to get a session string:

```bash
# Install telegram package globally (already installed in project)
npm install -g telegram

# Run authentication script (create this file)
node scripts/generate-session.js
```

Create `scripts/generate-session.js`:

```javascript
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const apiId = YOUR_API_ID; // Replace with your API_ID
const apiHash = 'YOUR_API_HASH'; // Replace with your API_HASH

(async () => {
  const client = new TelegramClient(
    new StringSession(''),
    apiId,
    apiHash,
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () => await input.text('Phone number: '),
    password: async () => await input.text('Password (if 2FA enabled): '),
    phoneCode: async () => await input.text('Verification code: '),
    onError: (err) => console.log(err),
  });

  console.log('Session string:');
  console.log(client.session.save());

  await client.disconnect();
})();
```

Run the script:
```bash
node scripts/generate-session.js
```

Follow the prompts and save the session string.

### Step 3: Update Environment Variables

Add to your `.env` file:

```env
# Required for basic bot functionality
BOT_TOKEN=your_bot_token
WEB_APP_URL=your_webapp_url

# Optional: For voice chat streaming
API_ID=12345678
API_HASH=your_api_hash_here
SESSION_STRING=your_session_string_here
```

### Step 4: Install Native Dependencies (Optional)

For actual audio streaming (not just starting voice chats), you need:

```bash
# System dependencies (Ubuntu/Debian)
sudo apt-get install -y python3 make g++ libssl-dev

# NPM package (experimental)
npm install @tgcalls/node
```

**Note:** This step is optional and may fail due to native dependencies. The basic voice chat functionality will work without it.

### Step 5: Add Azan Audio File

Update the azan URL in `src/application/reminder/ReminderScheduler.ts`:

```typescript
// In sendPrayerTimeReminder method (line ~177)
if (isGroup) {
  const azanUrl = 'https://your-cdn.com/azan.ogg'; // Your azan audio URL
  const method = await this.notificationService.broadcastAzan(
    userId,
    azanUrl,
    `🕌 ${prayer} Azan`
  );
  console.log(`📢 Broadcasted azan for ${prayer} via ${method} in group ${userId}`);
}
```

Supported formats: `.ogg`, `.mp3`, `.m4a`

## How It Works

When prayer time arrives:

1. **If voice chat is configured and available:**
   - System tries to start a voice chat in the group
   - Streams azan audio live
   - Returns `'voice_chat'` status

2. **If voice chat is not available (fallback):**
   - Sends azan as a voice message
   - Returns `'voice_message'` status

3. **If both fail:**
   - Logs error
   - Returns `'failed'` status

## Bot Permissions

For voice chat streaming, the bot needs:
- ✅ Admin rights in the group
- ✅ "Manage Voice Chats" permission enabled

## Troubleshooting

### Voice chat doesn't start
- Check bot has admin rights with "Manage Voice Chats" permission
- Verify API_ID, API_HASH, and SESSION_STRING are correct
- Check logs for initialization errors

### Audio doesn't stream
- Native dependencies (@tgcalls/node) may not be installed
- System falls back to voice message automatically

### Session expired
- Re-run `generate-session.js` to get a new session string
- Update SESSION_STRING in `.env`

## Security Notes

⚠️ **Important:**
- Never commit `.env` file with credentials to git
- Keep SESSION_STRING private (it grants access to your Telegram account)
- Use a dedicated Telegram account for the bot (not your personal account)
- Consider using environment variables in production instead of `.env`

## Default Behavior (No Configuration)

If you don't configure voice chat streaming:
- ✅ Reminders still work normally
- ✅ Azan is sent as voice message in groups
- ℹ️ Voice chat streaming is disabled (gracefully)

No errors will occur - the system falls back to voice messages automatically.
