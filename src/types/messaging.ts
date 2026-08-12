export interface ConversationParticipant {
  name: string;
  avatar: string;
}

export interface ConversationLastMessage {
  content: string;
  senderId: string;
  createdAt: unknown;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantProfiles: Record<string, ConversationParticipant>;
  lastMessage: ConversationLastMessage | null;
  unreadCounts: Record<string, number>;
  typingUsers: string[];
  createdAt: unknown;
  updatedAt: unknown;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  content: string;
  createdAt: unknown;
  read?: boolean;
  ciphertext?: string;
  iv?: string;
  encryptionVersion?: number;
  senderPublicKey?: JsonWebKey;
  recipientPublicKey?: JsonWebKey;
  decryptionFailed?: boolean;
}
