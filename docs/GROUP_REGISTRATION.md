# Group Registration Guide

The `/start` command now supports both individual users and group chats. This guide explains how group registration works.

## How It Works

### Private Chats (Individual Users)
When a user runs `/start` in a private chat with the bot:
- The user's Telegram ID is used as the entity ID
- User's first name is stored as display name
- User's username is stored (if available)

### Group Chats
When `/start` is run in a group chat:
- The **group's chat ID** is used as the entity ID (not the user who ran the command)
- The **group's title/name** is stored as display name
- Username is set to null (groups don't have usernames)
- A "Group Setup" banner is shown to indicate group mode

## Registration Flow

### 1. Start Command
**Private Chat:**
```
User: /start
Bot: Welcome message + language selection
```

**Group Chat:**
```
User: /start
Bot: 👥 Group Setup
     Welcome to the Prayer Reminder Bot!

     Welcome message + language selection
```

### 2. Language Selection
- Works identically for both private chats and groups
- Selected language is stored for the group/user

### 3. Location Sharing
- **Private Chat**: User shares their personal location
- **Group Chat**: Any member can share location for the entire group

### 4. Functionality Selection
- Choose which features to enable (reminder, tracker, etc.)
- Settings apply to the entire group or individual user

### 5. Complete Setup
- Registration is complete
- Group/user is now ready to receive reminders

## Key Differences

| Feature | Private Chat | Group Chat |
|---------|-------------|------------|
| Entity ID | User's Telegram ID | Group's Chat ID |
| Display Name | User's first name | Group title |
| Username | User's @username | null |
| Location | User's location | Group's shared location |
| Reminders | Sent to individual | Sent to entire group |
| Azan | Not broadcasted | Broadcasted (voice chat/message) |

## Data Storage

Both users and groups are stored using the same `User` entity in the database:

```typescript
{
  userId: number,        // User ID or Group Chat ID
  username: string?,     // @username (null for groups)
  displayName: string,   // First name or Group title
  language: string,      // 'en' or 'ar'
  location: {            // Shared location
    latitude: number,
    longitude: number
  },
  functionalities: {     // Enabled features
    reminder: boolean,
    tracker: boolean,
    remindByCall: boolean
  },
  isSubscribed: boolean,
  isActive: boolean
}
```

## Examples

### Example 1: Private Chat Registration
```
User: /start
Bot: Welcome! Choose your language:
     🇬🇧 English | 🇸🇦 العربية

[User selects English]

Bot: Language selected!
     Please share your location to receive prayer time reminders.
     [Send Location Button]

[User shares location]

Bot: Location saved!
     Choose which features you'd like to enable:
     - 📱 Prayer Reminders
     - 📊 Prayer Tracker
     - ☎️ Remind by Call
     ✅ Skip

[User selects "Prayer Reminders"]

Bot: Setup complete! You're all set to receive prayer reminders.
```

### Example 2: Group Chat Registration
```
Admin: /start
Bot: 👥 Group Setup
     Welcome to the Prayer Reminder Bot!

     Choose your language:
     🇬🇧 English | 🇸🇦 العربية

[Admin selects Arabic]

Bot: تم اختيار اللغة!
     يرجى مشاركة موقع المجموعة لتلقي تذكيرات أوقات الصلاة.
     [زر إرسال الموقع]

[Admin shares location]

Bot: تم حفظ الموقع!
     اختر الميزات التي تريد تفعيلها:
     - 📱 تذكير الصلاة
     - 📊 تتبع الصلاة
     - ☎️ تذكير بمكالمة
     ✅ تخطي

[Admin enables all features]

Bot: اكتمل الإعداد! المجموعة جاهزة الآن لتلقي تذكيرات الصلاة.
```

## Permissions Required

For groups, the bot needs:
- ✅ Read Messages permission
- ✅ Send Messages permission
- ✅ Admin rights (for voice chat streaming - optional)
- ✅ Manage Voice Chats (for azan broadcasting - optional)

## Reminders in Groups

Once a group is registered:

1. **10 Minutes Before Prayer**
   - Text reminder sent to group
   - All members can see it

2. **At Prayer Time**
   - Prayer time notification sent
   - Azan broadcasted (if configured):
     - Voice chat streaming (if enabled)
     - Voice message (fallback)

3. **5 Minutes After Prayer**
   - Mosque reminder sent to group

## Benefits of Group Registration

- ✅ Entire community receives reminders together
- ✅ Shared location for consistent prayer times
- ✅ One-time setup for all members
- ✅ Azan broadcasting in groups
- ✅ Collective prayer tracking (future)

## Testing Group Registration

To test group registration:

1. Add the bot to a group
2. Make the bot an admin (recommended)
3. Run `/start` in the group
4. Complete the setup flow
5. Use `/test_reminder` to verify reminders work
6. Try "Test Azan Broadcast" to check voice features

## Notes

- Any group member can trigger `/start` to register the group
- Only one registration per group (based on chat ID)
- Location can be updated anytime via `/subscribe`
- Language preferences persist across sessions
- Groups and users are treated uniformly in the system
