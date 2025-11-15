"""
Generate a Pyrogram session string for the voice chat service.

This script will prompt you to authenticate with your Telegram account
using your phone number. The resulting session string should be stored
in the SESSION_STRING environment variable.

IMPORTANT: Use a separate user account (not your main account) for this service.
"""

import asyncio
import os
from pyrogram import Client
from dotenv import load_dotenv


async def main():
    print("=" * 60)
    print("Pyrogram Session String Generator")
    print("=" * 60)
    print()
    print("This script will generate a session string for the voice chat service.")
    print()
    print("IMPORTANT:")
    print("- Use a SEPARATE Telegram account (not your main account)")
    print("- This account will be used to join and stream audio to voice chats")
    print("- Make sure this account is an admin in the groups where you want to")
    print("  broadcast azan")
    print()
    print("=" * 60)
    print()

    # Load environment variables
    load_dotenv()

    api_id = os.getenv('API_ID')
    api_hash = os.getenv('API_HASH')

    if not api_id or not api_hash:
        print("ERROR: API_ID and API_HASH not found in .env file")
        print()
        print("Please:")
        print("1. Go to https://my.telegram.org")
        print("2. Log in with your phone number")
        print("3. Go to 'API development tools'")
        print("4. Create a new application")
        print("5. Copy the api_id and api_hash")
        print("6. Add them to your .env file:")
        print("   API_ID=your_api_id")
        print("   API_HASH=your_api_hash")
        return

    print(f"Using API_ID: {api_id}")
    print()

    # Create a temporary client
    app = Client(
        name="temp_session",
        api_id=int(api_id),
        api_hash=api_hash,
        workdir="."
    )

    async with app:
        print()
        print("=" * 60)
        print("Authentication successful!")
        print("=" * 60)
        print()

        # Export session string
        session_string = await app.export_session_string()

        print("Your session string:")
        print()
        print(session_string)
        print()
        print("=" * 60)
        print()
        print("Add this to your .env file:")
        print(f"SESSION_STRING={session_string}")
        print()
        print("IMPORTANT:")
        print("- Keep this session string SECRET")
        print("- Do NOT share it with anyone")
        print("- Do NOT commit it to git")
        print("- This session string gives full access to your Telegram account")
        print()
        print("=" * 60)

    # Clean up temp session file
    try:
        os.remove("temp_session.session")
    except:
        pass


if __name__ == "__main__":
    asyncio.run(main())
