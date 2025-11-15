import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';

/**
 * Voice Chat Service
 * Handles Telegram voice chat streaming via Python Pyrogram microservice
 *
 * This service communicates with a Python microservice that uses Pyrogram and pytgcalls
 * to stream audio to Telegram voice chats.
 *
 * Note: The Python service must be running and accessible via gRPC
 */
export class VoiceChatService {
  private client: any = null;
  private serviceUrl: string;
  private isConnected: boolean = false;

  constructor(serviceUrl: string = 'localhost:50053') {
    this.serviceUrl = serviceUrl;
  }

  /**
   * Initialize the gRPC client connection to Python voice chat service
   */
  async initialize(): Promise<void> {
    try {
      // Load proto file
      const PROTO_PATH = path.join(__dirname, '../../../proto/voice-chat.proto');
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const voiceChatProto = grpc.loadPackageDefinition(packageDefinition).voicechat as any;

      // Create gRPC client
      this.client = new voiceChatProto.VoiceChatService(
        this.serviceUrl,
        grpc.credentials.createInsecure()
      );

      // Test connection with health check
      await this.healthCheck();
      this.isConnected = true;

      console.log('✅ Voice chat service connected successfully!');
    } catch (error) {
      console.error('Failed to initialize voice chat service:', error);
      console.warn('⚠️  Voice chat streaming disabled - Python service not available');
      console.warn(`   Make sure the voice-chat-service is running at ${this.serviceUrl}`);
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if voice chat service is available
   */
  isAvailable(): boolean {
    return this.client !== null && this.isConnected;
  }

  /**
   * Health check to verify connection to Python service
   */
  private async healthCheck(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('Client not initialized'));
        return;
      }

      this.client.HealthCheck({}, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.healthy);
        }
      });
    });
  }

  /**
   * Start a voice chat in a group
   */
  async startVoiceChat(chatId: number): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn(`Voice chat not available for chat ${chatId}`);
      return false;
    }

    return new Promise((resolve) => {
      this.client.StartVoiceChat({ chat_id: chatId }, (error: any, response: any) => {
        if (error) {
          console.error(`Failed to start voice chat in group ${chatId}:`, error.message);
          resolve(false);
        } else {
          console.log(`✅ ${response.message}`);
          resolve(response.success);
        }
      });
    });
  }

  /**
   * Stream audio to a voice chat
   *
   * @param chatId - The chat ID where voice chat is active
   * @param audioUrl - URL to the audio file to stream
   */
  async streamAudio(chatId: number, audioUrl: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn(`Cannot stream audio: voice chat not available for chat ${chatId}`);
      return false;
    }

    return new Promise((resolve) => {
      console.log(`🎵 Streaming audio to chat ${chatId} from ${audioUrl}`);

      this.client.StreamAzan(
        { chat_id: chatId, audio_url: audioUrl },
        (error: any, response: any) => {
          if (error) {
            console.error(`Failed to stream audio to chat ${chatId}:`, error.message);
            resolve(false);
          } else {
            if (response.success) {
              console.log(`✅ ${response.message}`);
            } else {
              console.warn(`⚠️  ${response.message}`);
            }
            resolve(response.success);
          }
        }
      );
    });
  }

  /**
   * Stop voice chat in a group
   */
  async stopVoiceChat(chatId: number): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    return new Promise((resolve) => {
      this.client.StopVoiceChat({ chat_id: chatId }, (error: any, response: any) => {
        if (error) {
          console.error(`Failed to stop voice chat in group ${chatId}:`, error.message);
        } else {
          console.log(`✅ ${response.message}`);
        }
        resolve();
      });
    });
  }

  /**
   * Start a 1-on-1 voice call with a user
   *
   * @param userId - The user ID to call
   * @param audioUrl - URL of audio file to play during call
   * @param durationSeconds - Maximum call duration (default: 180 seconds)
   */
  async startCall(userId: number, audioUrl: string, durationSeconds: number = 180): Promise<string | null> {
    if (!this.isAvailable()) {
      console.warn(`Cannot start call: voice chat not available for user ${userId}`);
      return null;
    }

    return new Promise((resolve) => {
      console.log(`📞 Starting call to user ${userId}`);

      this.client.StartCall(
        {
          user_id: userId,
          audio_url: audioUrl,
          duration_seconds: durationSeconds
        },
        (error: any, response: any) => {
          if (error) {
            console.error(`Failed to start call to user ${userId}:`, error.message);
            resolve(null);
          } else {
            if (response.success) {
              console.log(`✅ ${response.message} - Call ID: ${response.call_id}`);
              resolve(response.call_id);
            } else {
              console.warn(`⚠️  ${response.message}`);
              resolve(null);
            }
          }
        }
      );
    });
  }

  /**
   * End an active 1-on-1 call
   *
   * @param callId - The call ID to end
   */
  async endCall(callId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      this.client.EndCall({ call_id: callId }, (error: any, response: any) => {
        if (error) {
          console.error(`Failed to end call ${callId}:`, error.message);
          resolve(false);
        } else {
          console.log(`✅ ${response.message}`);
          resolve(response.success);
        }
      });
    });
  }

  /**
   * Disconnect the client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      // gRPC client doesn't need explicit disconnection
      this.client = null;
      this.isConnected = false;
      console.log('✅ Voice chat service disconnected');
    }
  }
}
