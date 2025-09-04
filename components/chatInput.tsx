import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea
} from '@/components/ai-elements/prompt-input'

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
    <div className="max-w-4xl mx-auto">
      <PromptInput onSubmit={e => {
        e.preventDefault()
        handleSendMessage()
      }} className="mt-4 relative">
        <PromptInputTextarea
          value={input}
          onChange={e => setInput(e.target.value)}
          aria-label="Prompt"
          spellCheck={true}
          className="ring-offset-secondary min-h-[auto] text-[1rem] text-zinc-400"
          placeholder="Describe your dream..."
        />
        <PromptInputSubmit
          className="absolute right-0 top-0 mt-3 mr-3"
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
        {/* <PromptInputToolbar className="p-3 justify-end">
        </PromptInputToolbar> */}
      </PromptInput>
    </div>
  )
}
