/**
 * Chat Store
 * Manages AI chat state with Zustand
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ChatMessage } from '@/types'

interface ChatStore {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  sessionId: string | null
  selectedMonth: string | null  // Track current month from dashboard
  
  // Actions
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setSessionId: (sessionId: string) => void
  setSelectedMonth: (month: string | null) => void
  clearMessages: () => void
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isLoading: false,
      sessionId: null,
      selectedMonth: null,
      
      openChat: () => set({ isOpen: true }),
      
      closeChat: () => set({ isOpen: false }),
      
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: generateMessageId(),
              timestamp: new Date(),
            },
          ],
        })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setSessionId: (sessionId) => set({ sessionId }),
      
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      
      clearMessages: () => set({ messages: [], sessionId: null }),
    }),
    {
      name: 'vtg-chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
        sessionId: state.sessionId,
        selectedMonth: state.selectedMonth,
      }),
    }
  )
)
