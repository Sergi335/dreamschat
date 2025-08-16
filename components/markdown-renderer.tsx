import { memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// Componente memoizado para el Markdown
export const MarkdownRenderer = memo(({ content }: { content: string }) => (
  <Markdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p style={{ margin: '0.5rem 0' }}>{children}</p>,
      ul: ({ children }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', listStyleType: 'disc' }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', listStyleType: 'decimal' }}>{children}</ol>,
      li: ({ children }) => <li style={{ margin: '0.25rem 0' }}>{children}</li>,
      table: ({ children }) => (
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          margin: '1rem 0',
          border: '1px solid #374151'
        }}>
          {children}
        </table>
      ),
      th: ({ children }) => (
        <th style={{
          border: '1px solid #374151',
          padding: '0.5rem',
          backgroundColor: '#374151',
          textAlign: 'left'
        }}>
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td style={{
          border: '1px solid #374151',
          padding: '0.5rem'
        }}>
          {children}
        </td>
      ),
      code: ({ children, className }) => {
        const isInline = !className
        return isInline
          ? (
            <code style={{
              backgroundColor: '#374151',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}>
              {children}
            </code>
          )
          : (
            <pre style={{
              backgroundColor: '#1f2937',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              margin: '0.5rem 0'
            }}>
              <code>{children}</code>
            </pre>
          )
      },
      blockquote: ({ children }) => (
        <blockquote style={{
          borderLeft: '4px solid #6b7280',
          paddingLeft: '1rem',
          margin: '0.5rem 0',
          fontStyle: 'italic'
        }}>
          {children}
        </blockquote>
      )
    }}
  >
    {content}
  </Markdown>
))

MarkdownRenderer.displayName = 'MarkdownRenderer'
