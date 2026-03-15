// @ts-nocheck
"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Send, Bot, User, PlusCircle, Wallet, TrendingUp, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getChatHistory } from "@/actions/chat"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: "Hi! I'm your AI financial assistant. You can tell me to log an expense like 'I just bought a 4 euro coffee' or ask questions about your spending!"
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await getChatHistory()
        if (history && history.length > 0) {
          setMessages(history.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.message,
          })))
        }
      } catch (err) {
        console.error("Failed to fetch history", err)
      } finally {
        setInitialLoaded(true)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsLoading(true)

    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      // Stream raw text response from toTextStreamResponse()
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      const assistantId = crypto.randomUUID()

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          assistantText += chunk
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: assistantText } : m
          ))
        }
      }

      // If no text was streamed, show a fallback
      if (!assistantText.trim()) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: 'Done! The action was completed successfully.' } : m
        ))
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const quickActions = [
    { label: "Log an expense", icon: <PlusCircle className="h-4 w-4 mr-2" />, prompt: "I'd like to log a new expense." },
    { label: "Check my budget", icon: <Wallet className="h-4 w-4 mr-2" />, prompt: "How much can I spend this week?" },
    { label: "View my expenses", icon: <TrendingUp className="h-4 w-4 mr-2" />, prompt: "Show my recent expenses" }
  ]

  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-8rem)] pb-4 pt-4">
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Chat with your intelligent financial companion.</p>
      </div>

      <Card className="flex-1 flex flex-col border-border/50 bg-background/50 backdrop-blur-xl shadow-sm overflow-hidden min-h-0">
        <CardHeader className="border-b border-border/50 shrink-0 bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat
          </CardTitle>
          <CardDescription>Powered by OpenAI</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {!initialLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex gap-2 items-center text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span className="animate-pulse">Loading memory...</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                      : 'bg-muted/50 rounded-tl-sm border border-border/50 shadow-sm'
                  }`}>
                    {msg.content ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="flex items-center gap-1 py-1">
                        <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-secondary flex items-center justify-center border border-border/50">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 justify-start">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-muted/50 rounded-tl-sm border border-border/50 flex items-center gap-1 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </>
          )}
        </CardContent>

        <div className="p-4 bg-background/80 border-t border-border/50 shrink-0 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
            {quickActions.map((action, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="bg-background/50 hover:bg-muted text-xs transition-transform active:scale-95 text-muted-foreground hover:text-foreground"
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading || !initialLoaded}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-4 items-center max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || !initialLoaded}
              className="flex-1 h-10 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading || !initialLoaded}
              className="shrink-0 transition-transform active:scale-95 shadow-md"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
