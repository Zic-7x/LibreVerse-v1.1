import type { Message } from "@platform/shared-types";

export interface RealtimePublisher {
  publishMessageCreated(conversationId: string, message: Message): void;
  publishMessageUpdated(conversationId: string, message: Message): void;
  publishMessageDeleted(conversationId: string, message: Message): void;
  publishTypingIndicator(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ): void;
  publishReactionAdded?(
    conversationId: string,
    payload: { messageId: string; userId: string; emoji: string },
  ): void;
  publishReactionRemoved?(
    conversationId: string,
    payload: { messageId: string; userId: string; emoji: string },
  ): void;
}
