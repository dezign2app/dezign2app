import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SelectedContext = {
    text: string;
    from: number;
    to: number;
    id: string;
}

export const RESET_STREAMING_TEXT = "----reset---"
export const TOGGLE_POPUP = "----toggle-popup---"



interface ChatStore {
    selectedContext: SelectedContext[]
    setSelectedContext: (selectedText: SelectedContext | "reset") => void
    removeContext: (id: string) => void
    streamingText: string
    setStreamingText: (text: string) => void
    streamingThinking: string
    setStreamingThinking: (text: string) => void
    showAIPopup: boolean
    setShowAIPopup: (show: boolean | typeof TOGGLE_POPUP) => void
    conversationId: string | null
    setConversationId: (id: string | null) => void
    sendingMessage: boolean
    setSendingMessage: (show: boolean) => void
    showHistory: boolean
    setShowHistory: (show: boolean) => void
    streamingId: string | null
    setStreamingId: (id: string | null) => void
    resetStreamingState: () => void
    activeRequestController: AbortController | null
    setActiveRequestController: (controller: AbortController | null) => void
    abortActiveRequest: () => void
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set) => ({
            sendingMessage: false,
            setSendingMessage: (show: boolean) => set({ sendingMessage: show }),
            streamingText: "",
            setStreamingText: (text: string) => set((state) => {
                if (text === RESET_STREAMING_TEXT) return { streamingText: "" };

                return { streamingText: state.streamingText + text };
            }),
            streamingThinking: "",
            setStreamingThinking: (text: string) => set((state) => {
                if (text === RESET_STREAMING_TEXT) return { streamingThinking: "" };
                return { streamingThinking: state.streamingThinking + text };
            }),
            selectedContext: [],
            showAIPopup: false,
            setShowAIPopup: (show: boolean | typeof TOGGLE_POPUP) => set((state) => ({
                showAIPopup: show === TOGGLE_POPUP ? !state.showAIPopup : show
            })),
            setSelectedContext: (selectedText: SelectedContext | "reset") => set((state) => {
                if(selectedText === "reset") return {selectedContext: []}
                const isOverlapping = state.selectedContext.some((existing) => {
                    return existing.from === selectedText.from && existing.to === selectedText.to;
                });

                if (isOverlapping) {
                    return state;
                }

                return { selectedContext: [...state.selectedContext, selectedText] }
            }),
            removeContext: (id: string) => set((state) => ({
                selectedContext: state.selectedContext.filter((context) => context.id !== id)
            })),
            conversationId: null,
            setConversationId: (id: string | null) => set({ conversationId: id }),
            showHistory: false,
            setShowHistory: (show: boolean) => set({ showHistory: show }),
            streamingId: null,
            setStreamingId: (id: string | null) => set({ streamingId: id }),
            resetStreamingState: () => set({
                streamingText: "",
                streamingThinking: "",
                streamingId: null,
            }),
            activeRequestController: null,
            setActiveRequestController: (controller: AbortController | null) =>
                set({ activeRequestController: controller }),
            abortActiveRequest: () =>
                set((state) => {
                    state.activeRequestController?.abort();

                    return {
                        activeRequestController: null,
                    };
                }),
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                showAIPopup: state.showAIPopup, 
                conversationId: state.conversationId 
            }),
        }
    )
)
