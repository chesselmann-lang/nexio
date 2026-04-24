import { create } from "zustand";
import type { ConversationWithMembers, MessageWithSender } from "@/types/database";

interface ChatState {
  conversations: ConversationWithMembers[];
  activeConversationId: string | null;
  messages: Record<string, MessageWithSender[]>;
  typingUsers: Record<string, string[]>; // conversationId -> userIds
  setConversations: (convs: ConversationWithMembers[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, msg: MessageWithSender) => void;
  setMessages: (conversationId: string, msgs: MessageWithSender[]) => void;
  updateMessage: (conversationId: string, msgId: string, update: Partial<MessageWithSender>) => void;
  setTyping: (conversationId: string, userIds: string[]) => void;
  markRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},

  setConversations: (convs) => set({ conversations: convs }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), msg],
      },
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, last_message: msg, last_message_at: msg.created_at }
          : c
      ),
    })),

  setMessages: (conversationId, msgs) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: msgs },
    })),

  updateMessage: (conversationId, msgId, update) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
          m.id === msgId ? { ...m, ...update } : m
        ),
      },
    })),

  setTyping: (conversationId, userIds) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [conversationId]: userIds },
    })),

  markRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),
}));
