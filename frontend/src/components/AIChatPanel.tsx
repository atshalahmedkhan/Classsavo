import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { aiChatApi, type ChatTurn } from '@/api/aiChat';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage } from '@/lib/apiError';

interface AIChatPanelProps {
  chapterId: number;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#c2622a]/60 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#c2622a]/60 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#c2622a]/60 [animation-delay:300ms]" />
    </div>
  );
}

export function AIChatPanel({ chapterId }: AIChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setError('');
  }, [chapterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError('');
    setInput('');
    const userMessage: ChatTurn = { role: 'user', content: text };
    const history = [...messages];
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { response } = await aiChatApi.send(chapterId, text, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'The AI tutor is unavailable right now. Please try again.'));
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-[#e8ddd0] bg-[#faf6f1] shadow-[0_8px_32px_rgba(194,98,42,0.15)] sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-[#e8ddd0] bg-white/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c2622a]"
                style={{ boxShadow: '0 0 0 2px #faf6f1, 0 0 0 3px rgba(194, 98, 42, 0.25)' }}
              />
              <h3 className="font-serif text-base font-semibold text-[#2c1810]">AI Tutor</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]"
              aria-label="Close AI tutor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && !loading && (
              <p className="text-center text-sm text-[#6b5c52]">
                Ask me anything about this chapter!
              </p>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c2622a]/15 text-[#c2622a]">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-[#c2622a] text-white'
                      : 'rounded-bl-sm border border-[#e8ddd0] bg-white text-[#2c1810]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c2622a]/15 text-[#c2622a]">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-[#e8ddd0] bg-white">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="border-t border-[#e8ddd0] px-4 py-2 text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2 border-t border-[#e8ddd0] bg-white/60 p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this chapter..."
              className="flex-1 border-[#e8ddd0] bg-white"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button
              type="button"
              className="ghibli-gradient-primary shrink-0 hover:brightness-95"
              disabled={loading || !input.trim()}
              onClick={() => void handleSend()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full ghibli-gradient-primary text-white shadow-[0_4px_20px_rgba(194,98,42,0.35)] transition-transform hover:brightness-95 hover:scale-105"
        aria-label={open ? 'Close AI tutor' : 'Open AI tutor'}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
    </div>
  );
}
