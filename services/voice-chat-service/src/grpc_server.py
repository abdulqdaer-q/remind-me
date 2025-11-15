"""gRPC server for voice chat service."""

import asyncio
import logging
from concurrent import futures
import grpc
from grpc import aio

# Import generated proto files
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'generated'))

import voice_chat_pb2
import voice_chat_pb2_grpc

from voice_chat import VoiceChatManager

logger = logging.getLogger(__name__)


class VoiceChatServicer(voice_chat_pb2_grpc.VoiceChatServiceServicer):
    """gRPC servicer for voice chat operations."""

    def __init__(self, voice_chat_manager: VoiceChatManager):
        self.voice_chat_manager = voice_chat_manager

    async def StreamAzan(self, request, context):
        """Stream azan audio to a voice chat."""
        try:
            logger.info(f"Received StreamAzan request for chat {request.chat_id}")

            success = await self.voice_chat_manager.stream_audio(
                request.chat_id,
                request.audio_url
            )

            if success:
                return voice_chat_pb2.StreamAzanResponse(
                    success=True,
                    message="Successfully streamed azan"
                )
            else:
                return voice_chat_pb2.StreamAzanResponse(
                    success=False,
                    message="Failed to stream azan"
                )

        except Exception as e:
            logger.error(f"Error in StreamAzan: {e}")
            return voice_chat_pb2.StreamAzanResponse(
                success=False,
                message=f"Error: {str(e)}"
            )

    async def StartVoiceChat(self, request, context):
        """Start a voice chat in a group."""
        try:
            logger.info(f"Received StartVoiceChat request for chat {request.chat_id}")

            success = await self.voice_chat_manager.start_voice_chat(
                request.chat_id
            )

            if success:
                return voice_chat_pb2.StartVoiceChatResponse(
                    success=True,
                    message="Successfully started voice chat"
                )
            else:
                return voice_chat_pb2.StartVoiceChatResponse(
                    success=False,
                    message="Failed to start voice chat"
                )

        except Exception as e:
            logger.error(f"Error in StartVoiceChat: {e}")
            return voice_chat_pb2.StartVoiceChatResponse(
                success=False,
                message=f"Error: {str(e)}"
            )

    async def StopVoiceChat(self, request, context):
        """Stop a voice chat in a group."""
        try:
            logger.info(f"Received StopVoiceChat request for chat {request.chat_id}")

            success = await self.voice_chat_manager.stop_voice_chat(
                request.chat_id
            )

            if success:
                return voice_chat_pb2.StopVoiceChatResponse(
                    success=True,
                    message="Successfully stopped voice chat"
                )
            else:
                return voice_chat_pb2.StopVoiceChatResponse(
                    success=False,
                    message="Failed to stop voice chat"
                )

        except Exception as e:
            logger.error(f"Error in StopVoiceChat: {e}")
            return voice_chat_pb2.StopVoiceChatResponse(
                success=False,
                message=f"Error: {str(e)}"
            )

    async def HealthCheck(self, request, context):
        """Health check endpoint."""
        return voice_chat_pb2.HealthCheckResponse(healthy=True)


async def serve(voice_chat_manager: VoiceChatManager, port: int = 50053):
    """Start the gRPC server."""
    server = aio.server()
    voice_chat_pb2_grpc.add_VoiceChatServiceServicer_to_server(
        VoiceChatServicer(voice_chat_manager),
        server
    )

    listen_addr = f'0.0.0.0:{port}'
    server.add_insecure_port(listen_addr)

    logger.info(f"Starting gRPC server on {listen_addr}")
    await server.start()

    try:
        await server.wait_for_termination()
    except KeyboardInterrupt:
        logger.info("Shutting down gRPC server")
        await server.stop(5)
