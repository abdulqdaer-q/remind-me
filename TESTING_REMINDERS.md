# Testing Prayer Reminders

This guide explains how to test the prayer reminder system without waiting for actual prayer times.

## Test Command

The bot includes a `/test_reminder` command that allows you to immediately test all reminder types.

## How to Test

### 1. Start a Test Session

In any chat with the bot (private or group), send:

```
/test_reminder
```

You'll receive a test menu with the following options:

### 2. Test Options

#### ⏰ **10 Min Before Reminder (Fajr)**
Tests the "10 minutes before prayer" notification:
- Shows the upcoming prayer name
- Reminds about the previous prayer if not done
- Available in English and Arabic

**Example Output (English):**
```
⏰ Reminder: Fajr prayer will start in 10 minutes.
If you haven't prayed Isha yet, please pray it now!
```

**Example Output (Arabic):**
```
⏰ تنبيه: صلاة الفجر ستبدأ بعد ١٠ دقائق.
إذا لم تصلِ العشاء بعد، صلِّها الآن!
```

---

#### 🕌 **Prayer Time Reminder (Dhuhr)**
Tests the "at prayer time" notification:
- Shows that it's time for the prayer
- In groups, indicates that azan would be broadcasted

**Example Output (English):**
```
🕌 It's time for Dhuhr prayer!

May Allah accept your prayer.
```

**Example Output (Arabic):**
```
🕌 حان الآن وقت صلاة الظهر!

اللهم صلِّ على محمد وآل محمد
```

**In Groups:**
```
📢 (In production, azan would be broadcasted here. Use /test_reminder → Test Azan to try it.)
```

---

#### 📍 **5 Min After Reminder (Asr)**
Tests the "5 minutes after prayer" notification:
- Encourages going to the mosque
- Available in English and Arabic

**Example Output (English):**
```
🕌 5 minutes have passed since Asr prayer time.

Please go to the mosque to pray if possible!
```

**Example Output (Arabic):**
```
🕌 مر ٥ دقائق على أذان العصر.

توجه إلى المسجد لأداء الصلاة إن أمكن!
```

---

#### 🎵 **Test Azan Broadcast**
Tests the azan broadcasting system (groups only):

**Requirements:**
- Must be used in a group chat
- Bot must be admin with "Manage Voice Chats" permission (for voice chat streaming)

**What It Does:**
1. Checks if voice chat streaming is configured
2. If yes: Tries to start voice chat and stream azan
3. If no: Falls back to sending azan as voice message
4. Reports which method was used

**Example Outputs:**

**With Voice Chat Configured:**
```
✅ Azan broadcasted via voice chat streaming!
[Voice chat starts with live azan audio]
```

**Without Voice Chat (Fallback):**
```
✅ Azan sent as voice message!

ℹ️ Voice chat streaming is not configured.
See VOICE_CHAT_SETUP.md for setup instructions.
[Voice message with azan appears]
```

**In Private Chats:**
```
⚠️ Azan broadcast is only available in group chats.
```

---

## Language Detection

The test command automatically detects your language:
- **Arabic**: If your Telegram language is set to Arabic
- **English**: Default for all other languages

## Testing in Different Chat Types

### Private Chat
```
/test_reminder
```
- ✅ 10-minute before reminders work
- ✅ Prayer time reminders work
- ✅ 5-minute after reminders work
- ❌ Azan broadcast disabled (groups only)

### Group Chat
```
/test_reminder
```
- ✅ All reminders work
- ✅ Azan broadcast available
- ✅ Voice chat streaming (if configured)
- ✅ Voice message fallback

## What Gets Tested

This test command validates:
- ✅ Message delivery system
- ✅ Language switching (EN/AR)
- ✅ Notification formatting
- ✅ Group detection
- ✅ Voice chat service availability
- ✅ Azan broadcasting with fallback
- ✅ All three reminder types

## Production Behavior

In production, the scheduler automatically:
1. Checks subscribed users every minute
2. Compares current time with prayer times
3. Sends reminders at the correct times
4. Broadcasts azan in groups at prayer time

## Troubleshooting

### "Nothing happens when I click Test Azan"
- ✅ Make sure you're in a group chat
- ✅ Check that the bot has been added to the group
- ✅ Verify bot permissions if using voice chat

### "Voice chat doesn't start"
- ✅ Bot needs admin rights
- ✅ Bot needs "Manage Voice Chats" permission
- ✅ Check `API_ID`, `API_HASH`, `SESSION_STRING` in `.env`
- ✅ See `VOICE_CHAT_SETUP.md` for detailed setup

### "Messages are in the wrong language"
- Language is auto-detected from your Telegram settings
- Change your Telegram language to test different languages

## Example Test Flow

1. **Open chat with bot** (private or group)
2. **Send** `/test_reminder`
3. **See menu** with test options
4. **Click** "⏰ 10 Min Before (Fajr)"
5. **Receive** immediate 10-minute reminder
6. **Send** `/test_reminder` again
7. **Click** "🎵 Test Azan Broadcast"
8. **Experience** azan via voice chat or voice message

## Notes

- Test command is available to all users
- No subscription required for testing
- Azan test uses a sample audio file (replace with real azan in production)
- All tests are immediate - no waiting required
