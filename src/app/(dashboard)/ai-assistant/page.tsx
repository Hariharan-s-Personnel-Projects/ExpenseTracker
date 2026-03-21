"use client";

import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  Bot,
  PlusCircle,
  Wallet,
  TrendingUp,
  Loader2,
  Trash2,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { getChatHistory, clearChatHistory } from "@/actions/chat";

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hi! I'm your AI financial assistant. You can tell me to log an expense like 'I just bought a 40 rupee coffee' or ask questions about your spending!",
    },
  ],
};

export default function AiAssistantPage() {
  return (
    <Suspense fallback={<AiAssistantSkeleton />}>
      <AiAssistantContent />
    </Suspense>
  );
}

function AiAssistantSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)] -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="shrink-0 bg-primary/10 dark:bg-primary/15 border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">
            AI Financial Assistant
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by Groq AI
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-muted/30 dark:bg-muted/10">
        <div className="flex gap-2 items-center text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="animate-pulse">Loading memory...</span>
        </div>
      </div>
    </div>
  );
}

function AiAssistantContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt");
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(
    null,
  );
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const history = await getChatHistory();
        if (history && history.length > 0) {
          setInitialMessages(
            history.map((msg: any) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              parts: [
                {
                  type: "text" as const,
                  text: msg.message as string,
                },
              ],
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setInitialLoaded(true);
      }
    }
    fetchHistory();
  }, []);

  if (!initialLoaded) {
    return <AiAssistantSkeleton />;
  }

  return (
    <ChatInterface
      initialMessages={initialMessages ?? [WELCOME_MESSAGE]}
      initialPrompt={initialPrompt}
    />
  );
}

function ChatInterface({
  initialMessages,
  initialPrompt,
}: {
  initialMessages: UIMessage[];
  initialPrompt?: string | null;
}) {
  const [input, setInput] = useState("");
  const [promptSent, setPromptSent] = useState(false);

  const { messages, setMessages, sendMessage, status } = useChat({
    messages: initialMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const [isClearing, setIsClearing] = useState(false);

  const handleClearChat = async () => {
    if (isClearing || isLoading) return;
    setIsClearing(true);
    try {
      await clearChatHistory();
      setMessages([WELCOME_MESSAGE]);
    } catch (err) {
      console.error("Failed to clear chat", err);
    } finally {
      setIsClearing(false);
    }
  };

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-send prompt from URL (e.g. from dashboard quick input)
  useEffect(() => {
    if (initialPrompt && !promptSent && status === "ready") {
      setPromptSent(true);
      sendMessage({ text: initialPrompt });
    }
  }, [initialPrompt, promptSent, status, sendMessage]);

  const quickActions = [
    {
      label: "Log an expense",
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
      prompt: "I'd like to log a new expense.",
    },
    {
      label: "Check my budget",
      icon: <Wallet className="h-4 w-4 mr-2" />,
      prompt: "How much can I spend this week?",
    },
    {
      label: "View my expenses",
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
      prompt: "Show my recent expenses",
    },
  ];

  const getMessageText = (msg: UIMessage): string => {
    if (!msg.parts) return "";
    return msg.parts
      .filter(
        (part: any) => part.type === "text" && typeof part.text === "string",
      )
      .map((part: any) => part.text as string)
      .join("");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    await sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)] -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* WhatsApp-style header bar */}
      <div className="shrink-0 bg-primary/10 dark:bg-primary/15 border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              AI Financial Assistant
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by Groq AI
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          disabled={isClearing || isLoading || messages.length <= 1}
          className="text-muted-foreground hover:text-destructive"
        >
          {isClearing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Trash2 className="h-4 w-4 mr-1" />
          )}
          Clear
        </Button>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto bg-muted/30 dark:bg-muted/10 px-3 sm:px-6 py-4 space-y-3">
        {messages.map((msg) => {
          const text = getMessageText(msg as UIMessage);
          const toolParts = ((msg as UIMessage).parts || []).filter(
            (p: any) => p.type === "tool-invocation",
          );
          const hasContent = !!text || toolParts.length > 0;
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2.5 max-w-[85%] sm:max-w-[70%] shadow-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                    : "bg-card dark:bg-card border border-border/60 rounded-2xl rounded-bl-sm"
                }`}
              >
                {hasContent ? (
                  <div className="space-y-2">
                    {toolParts.map((part: any, i: number) => (
                      <ToolInvocationPart
                        key={part.toolInvocationId || i}
                        part={part}
                      />
                    ))}
                    {text && (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-card dark:bg-card border border-border/60 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
              <div
                className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Quick actions */}
      <div className="shrink-0 px-3 sm:px-6 pt-2 pb-1 bg-background border-t border-border/50">
        <div className="flex flex-wrap gap-2 justify-center">
          {quickActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="bg-background hover:bg-muted text-xs transition-transform active:scale-95 text-muted-foreground hover:text-foreground rounded-full"
              onClick={async () => {
                if (isLoading) return;
                await sendMessage({ text: action.prompt });
              }}
              disabled={isLoading}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* WhatsApp-style input bar */}
      <div className="shrink-0 px-3 sm:px-6 py-3 bg-background border-t border-border/30">
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 h-12 rounded-full border border-border bg-muted/50 px-5 py-2 text-[15px] ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-12 w-12 rounded-full transition-transform active:scale-95 shadow-md"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ToolInvocationPart({ part }: { part: any }) {
  const { toolName, state, result } = part;

  const toolLabels: Record<string, string> = {
    addExpense: "Adding expense",
    deleteExpense: "Deleting expense",
    updateExpense: "Updating expense",
  };

  if (state === "call" || state === "partial-call") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2 rounded-lg bg-muted/30">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{toolLabels[toolName] || "Processing"}...</span>
      </div>
    );
  }

  if (state === "result" && result) {
    return (
      <div
        className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg ${
          result.success
            ? "bg-green-500/10 text-green-700 dark:text-green-400"
            : "bg-red-500/10 text-red-700 dark:text-red-400"
        }`}
      >
        {result.success ? (
          <CircleCheck className="h-3 w-3 shrink-0" />
        ) : (
          <CircleX className="h-3 w-3 shrink-0" />
        )}
        <span>{result.message || (result.success ? "Done" : "Failed")}</span>
      </div>
    );
  }

  return null;
}
