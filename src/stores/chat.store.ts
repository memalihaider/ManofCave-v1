import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'admin';
  branchId?: string;
  timestamp: Date;
  read: boolean;
  conversationId: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  branchId?: string;
  type?: 'admin-to-branch' | 'customer';
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatStore {
  conversations: Conversation[];
  messages: Message[];
  activeConversation: string | null;
  isLoading: boolean;

  // Actions
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  markConversationAsRead: (conversationId: string) => void;
  addConversation: (conversation: Conversation) => void;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;

  // Getters
  getUnreadCount: () => number;
  getConversationMessages: (conversationId: string) => Message[];
  getBranchConversations: (branchId?: string) => Conversation[];
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: [],
      activeConversation: null,
      isLoading: false,

      setActiveConversation: (conversationId) => set({ activeConversation: conversationId }),

      addMessage: (message) => {
        set((state) => {
          // Check if message with this ID already exists
          const existingMessageIndex = state.messages.findIndex(m => m.id === message.id);
          if (existingMessageIndex !== -1) {
            // Message already exists, don't add duplicate
            return state;
          }

          // Ensure timestamp is a Date object
          const messageWithDate = {
            ...message,
            timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
          };
          const newMessages = [...state.messages, messageWithDate];
          const conversation = state.conversations.find(c => c.id === message.conversationId);

          if (conversation) {
            const updatedConversations = state.conversations.map(c =>
              c.id === message.conversationId
                ? {
                    ...c,
                    lastMessage: messageWithDate,
                    unreadCount: message.senderType === 'customer' ? c.unreadCount + 1 : c.unreadCount,
                    updatedAt: new Date()
                  }
                : c
            );
            return { messages: newMessages, conversations: updatedConversations };
          }

          return { messages: newMessages };
        });
      },

      markConversationAsRead: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          messages: state.messages.map(m =>
            m.conversationId === conversationId ? { ...m, read: true } : m
          )
        }));
      },

      addConversation: (conversation) => {
        set((state) => ({
          conversations: [...state.conversations, conversation]
        }));
      },

      setConversations: (conversations) => set({ conversations }),
      setMessages: (messages) => set({ messages }),
      setLoading: (loading) => set({ isLoading: loading }),

      getUnreadCount: () => {
        return get().conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      },

      getConversationMessages: (conversationId) => {
        return get().messages
          .filter(m => m.conversationId === conversationId)
          .sort((a, b) => {
            const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
            const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
            return aTime - bTime;
          });
      },

      getBranchConversations: (branchId) => {
        if (!branchId) {
          // Super admin sees all conversations
          return get().conversations;
        }
        // Branch admin sees only their branch conversations
        return get().conversations.filter(c => c.branchId === branchId);
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages
      })
    }
  )
);