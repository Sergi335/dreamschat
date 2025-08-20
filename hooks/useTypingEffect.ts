// hooks/useTypingEffect.ts
import React, { useCallback, useMemo } from 'react'

interface TypingConfig {
  longTextThreshold: number
  shortCharsPerStep: number
  longCharsPerStep: number
  tableCharsPerStep: number
  shortDelay: number
  longDelay: number
  tableDelay: number
}

const defaultConfig: TypingConfig = {
  longTextThreshold: 500,
  shortCharsPerStep: 8,
  longCharsPerStep: 20,
  tableCharsPerStep: 40,
  shortDelay: 8,
  longDelay: 2,
  tableDelay: 1
}

export function useTypingEffect (config: Partial<TypingConfig> = {}) {
  const finalConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config]
  )

  const simulateTyping = useCallback(async (
    content: string,
    shouldStopRef: React.MutableRefObject<boolean>,
    onUpdate: (displayed: string) => void
  ): Promise<string> => {
    const isLong = content.length > finalConfig.longTextThreshold
    const isTable = content.includes('|---') && content.includes('\n')

    const charsPerStep = isTable
      ? finalConfig.tableCharsPerStep
      : isLong
        ? finalConfig.longCharsPerStep
        : finalConfig.shortCharsPerStep

    const delay = isTable
      ? finalConfig.tableDelay
      : isLong
        ? finalConfig.longDelay
        : finalConfig.shortDelay

    let displayed = ''

    for (let i = 0; i < content.length; i += charsPerStep) {
      if (shouldStopRef.current) {
        break
      }

      displayed = content.slice(0, i + charsPerStep)
      onUpdate(displayed)

      await new Promise(resolve => setTimeout(resolve, delay))
    }

    return displayed
  }, [finalConfig])

  return { simulateTyping }
}
