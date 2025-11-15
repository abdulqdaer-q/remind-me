"""Main entry point for voice chat service."""

import asyncio
import logging
import os
import sys
from dotenv import load_dotenv
from pyrogram import Client

from voice_chat import VoiceChatManager
from grpc_server import serve

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


async def main():
    """Main function to start the voice chat service."""
    # Load environment variables
    load_dotenv()

    # Get configuration from environment
    api_id = os.getenv('API_ID')
    api_hash = os.getenv('API_HASH')
    session_string = os.getenv('SESSION_STRING')
    grpc_port = int(os.getenv('VOICE_CHAT_GRPC_PORT', '50053'))

    if not all([api_id, api_hash]):
        logger.error("Missing required environment variables: API_ID, API_HASH")
        sys.exit(1)

    if not session_string:
        logger.error("Missing SESSION_STRING environment variable")
        logger.error("Run 'python generate_session.py' to create a session string")
        sys.exit(1)

    logger.info("Initializing Pyrogram client with user session...")

    # Initialize Pyrogram client with user session (not bot token!)
    # This avoids conflicts with the main bot and provides better voice chat support
    app = Client(
        name="voice_chat_user",
        api_id=int(api_id),
        api_hash=api_hash,
        session_string=session_string,
        workdir="/tmp"
    )

    # Initialize voice chat manager
    voice_chat_manager = VoiceChatManager(app)

    try:
        # Start Pyrogram client
        logger.info("Starting Pyrogram client...")
        await app.start()
        logger.info("Pyrogram client started")

        # Start PyTgCalls
        logger.info("Starting PyTgCalls...")
        await voice_chat_manager.start()
        logger.info("PyTgCalls started")

        # Start gRPC server
        logger.info(f"Starting gRPC server on port {grpc_port}...")
        await serve(voice_chat_manager, grpc_port)

    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
    finally:
        # Cleanup
        logger.info("Shutting down...")
        try:
            await voice_chat_manager.stop()
            await app.stop()
            logger.info("Shutdown complete")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
