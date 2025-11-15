"""Voice chat streaming logic using Pyrogram and pytgcalls."""

import asyncio
import logging
import os
import tempfile
import uuid
from typing import Dict, Optional
from pyrogram import Client
from pytgcalls import PyTgCalls
from pytgcalls.types import AudioPiped, StreamAudioEnded
from pytgcalls.exceptions import NoActiveGroupCall, AlreadyJoinedError
import aiohttp

logger = logging.getLogger(__name__)


class VoiceChatManager:
    """Manages voice chat streaming for Telegram groups and 1-on-1 calls."""

    def __init__(self, client: Client):
        self.client = client
        self.pytgcalls = PyTgCalls(client)
        self.active_calls: Dict[int, bool] = {}  # Group voice chats
        self.active_private_calls: Dict[str, int] = {}  # call_id -> user_id mapping
        self.temp_files: Dict[int, str] = {}

    async def start(self):
        """Start the pytgcalls client."""
        try:
            await self.pytgcalls.start()
            logger.info("PyTgCalls client started successfully")
        except Exception as e:
            logger.error(f"Failed to start PyTgCalls: {e}")
            raise

    async def stop(self):
        """Stop the pytgcalls client."""
        try:
            # Leave all active group voice chats
            for chat_id in list(self.active_calls.keys()):
                await self.stop_voice_chat(chat_id)

            # End all active private calls
            for call_id in list(self.active_private_calls.keys()):
                await self.end_call(call_id)

            # Clean up temp files
            for temp_file in self.temp_files.values():
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file {temp_file}: {e}")

            await self.pytgcalls.stop()
            logger.info("PyTgCalls client stopped")
        except Exception as e:
            logger.error(f"Error stopping PyTgCalls: {e}")

    async def download_audio(self, url: str) -> str:
        """Download audio file from URL to temporary location."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"Failed to download audio: HTTP {response.status}")

                    # Create temp file
                    temp_file = tempfile.NamedTemporaryFile(
                        delete=False,
                        suffix='.mp3'
                    )
                    temp_path = temp_file.name

                    # Write audio data
                    content = await response.read()
                    temp_file.write(content)
                    temp_file.close()

                    logger.info(f"Downloaded audio to {temp_path}")
                    return temp_path
        except Exception as e:
            logger.error(f"Failed to download audio from {url}: {e}")
            raise

    async def stream_audio(self, chat_id: int, audio_url: str) -> bool:
        """Stream audio to a voice chat."""
        try:
            logger.info(f"Starting audio stream for chat {chat_id}")

            # Download audio file
            audio_path = await self.download_audio(audio_url)
            self.temp_files[chat_id] = audio_path

            # Create audio stream
            audio_stream = AudioPiped(audio_path)

            # Join voice chat and stream
            try:
                await self.pytgcalls.play(
                    chat_id,
                    audio_stream
                )
                self.active_calls[chat_id] = True
                logger.info(f"Successfully started streaming in chat {chat_id}")

                # Wait for stream to complete
                await self._wait_for_stream_end(chat_id)

                return True

            except AlreadyJoinedError:
                logger.warning(f"Already joined voice chat in {chat_id}, stopping and retrying")
                await self.stop_voice_chat(chat_id)
                await asyncio.sleep(1)
                # Retry
                await self.pytgcalls.play(chat_id, audio_stream)
                self.active_calls[chat_id] = True
                logger.info(f"Successfully started streaming in chat {chat_id} (retry)")
                await self._wait_for_stream_end(chat_id)
                return True

            except NoActiveGroupCall:
                logger.error(f"No active voice chat in {chat_id}")
                # Try to start voice chat first
                try:
                    # Use the bot to start a voice chat
                    await self.client.invoke(
                        pyrogram.raw.functions.phone.CreateGroupCall(
                            peer=await self.client.resolve_peer(chat_id),
                            random_id=self.client.rnd_id()
                        )
                    )
                    logger.info(f"Started voice chat in {chat_id}")
                    await asyncio.sleep(2)

                    # Retry streaming
                    await self.pytgcalls.play(chat_id, audio_stream)
                    self.active_calls[chat_id] = True
                    logger.info(f"Successfully started streaming in chat {chat_id} (after creating call)")
                    await self._wait_for_stream_end(chat_id)
                    return True
                except Exception as e:
                    logger.error(f"Failed to create voice chat: {e}")
                    return False

        except Exception as e:
            logger.error(f"Failed to stream audio in chat {chat_id}: {e}")
            return False
        finally:
            # Cleanup
            if chat_id in self.temp_files:
                try:
                    temp_file = self.temp_files[chat_id]
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                    del self.temp_files[chat_id]
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file: {e}")

    async def _wait_for_stream_end(self, chat_id: int):
        """Wait for stream to end naturally."""
        try:
            # Wait for stream to complete (max 10 minutes)
            max_wait = 600  # 10 minutes
            wait_time = 0

            while wait_time < max_wait:
                if chat_id not in self.active_calls:
                    break

                # Check if still streaming
                try:
                    call = await self.pytgcalls.get_call(chat_id)
                    if call is None or call.status == "NOT_PLAYING":
                        break
                except:
                    break

                await asyncio.sleep(1)
                wait_time += 1

            # Leave the call
            await self.stop_voice_chat(chat_id)

        except Exception as e:
            logger.error(f"Error waiting for stream end: {e}")

    async def stop_voice_chat(self, chat_id: int) -> bool:
        """Stop voice chat in a group."""
        try:
            if chat_id in self.active_calls:
                await self.pytgcalls.leave_call(chat_id)
                del self.active_calls[chat_id]
                logger.info(f"Left voice chat in {chat_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to leave voice chat {chat_id}: {e}")
            return False

    async def start_voice_chat(self, chat_id: int) -> bool:
        """Start a voice chat in a group."""
        try:
            import pyrogram.raw

            # Create a group call
            await self.client.invoke(
                pyrogram.raw.functions.phone.CreateGroupCall(
                    peer=await self.client.resolve_peer(chat_id),
                    random_id=self.client.rnd_id()
                )
            )
            logger.info(f"Created voice chat in {chat_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to start voice chat in {chat_id}: {e}")
            return False

    async def start_call(self, user_id: int, audio_url: str, duration_seconds: int = 180) -> tuple[bool, str]:
        """
        Start a 1-on-1 call with a user and play audio.

        Args:
            user_id: Telegram user ID to call
            audio_url: URL of audio file to play during call
            duration_seconds: Maximum call duration in seconds

        Returns:
            Tuple of (success, call_id)
        """
        call_id = str(uuid.uuid4())

        try:
            logger.info(f"Starting call {call_id} to user {user_id}")

            # Download audio file
            audio_path = await self.download_audio(audio_url)
            self.temp_files[user_id] = audio_path

            # Create audio stream
            audio_stream = AudioPiped(audio_path)

            # Start the call and play audio
            try:
                await self.pytgcalls.play(
                    user_id,
                    audio_stream
                )
                self.active_private_calls[call_id] = user_id
                logger.info(f"Successfully started call {call_id} with user {user_id}")

                # Schedule auto-hangup after duration
                asyncio.create_task(self._auto_end_call(call_id, duration_seconds))

                return True, call_id

            except Exception as e:
                logger.error(f"Failed to start call with user {user_id}: {e}")
                # Clean up temp file
                if user_id in self.temp_files:
                    try:
                        if os.path.exists(self.temp_files[user_id]):
                            os.remove(self.temp_files[user_id])
                        del self.temp_files[user_id]
                    except:
                        pass
                return False, ""

        except Exception as e:
            logger.error(f"Failed to prepare call for user {user_id}: {e}")
            return False, ""

    async def _auto_end_call(self, call_id: str, duration_seconds: int):
        """Automatically end call after specified duration."""
        try:
            await asyncio.sleep(duration_seconds)

            if call_id in self.active_private_calls:
                logger.info(f"Auto-ending call {call_id} after {duration_seconds}s")
                await self.end_call(call_id)
        except Exception as e:
            logger.error(f"Error in auto-end call: {e}")

    async def end_call(self, call_id: str) -> bool:
        """
        End an active 1-on-1 call.

        Args:
            call_id: The call identifier

        Returns:
            True if successful, False otherwise
        """
        try:
            if call_id not in self.active_private_calls:
                logger.warning(f"Call {call_id} not found in active calls")
                return False

            user_id = self.active_private_calls[call_id]
            logger.info(f"Ending call {call_id} with user {user_id}")

            # Leave the call
            try:
                await self.pytgcalls.leave_call(user_id)
            except Exception as e:
                logger.warning(f"Error leaving call: {e}")

            # Clean up
            del self.active_private_calls[call_id]

            if user_id in self.temp_files:
                try:
                    temp_file = self.temp_files[user_id]
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                    del self.temp_files[user_id]
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file: {e}")

            logger.info(f"Successfully ended call {call_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to end call {call_id}: {e}")
            return False
