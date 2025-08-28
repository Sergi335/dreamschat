import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar
} from '@/components/ai-elements/prompt-input'
import { Mic } from 'lucide-react'
export default function ChatInput ({
  input,
  setInput,
  handleSendMessage,
  isTyping,
  handleStopTyping,
  submitStatus
}: {
    input: string
    setInput: (value: string) => void
    handleSendMessage: () => void
    isTyping: boolean
    handleStopTyping: () => void
    submitStatus: 'submitted' | 'streaming' | 'error' | undefined
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex gap-2">
        <PromptInput onSubmit={e => {
          e.preventDefault()
          handleSendMessage()
        }} className="mt-4 relative">
          <PromptInputTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label="Prompt"
            spellCheck={true}
            className="ring-offset-secondary"
          />
          <PromptInputToolbar className="p-3">
            <Mic />
            <PromptInputSubmit
              status={submitStatus}
              disabled={!input.trim() && !isTyping}
              onClick={e => {
                if (isTyping) {
                  e.preventDefault()
                  handleStopTyping()
                }
                // Si no está escribiendo, submit normal
              }}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}
