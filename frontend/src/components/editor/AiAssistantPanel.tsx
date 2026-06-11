import { useState } from 'react';
import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

function buildAiDraft(prompt: string, existingText: string): string {
  const topic = prompt.trim() || 'this chapter topic';
  const contextLine = existingText.trim()
    ? ` It should connect to the current content: "${existingText.trim().slice(0, 180)}${existingText.length > 180 ? '...' : ''}".`
    : '';

  return [
    `Overview of ${topic}`,
    '',
    `This section introduces ${topic} in clear language for students.${contextLine}`,
    '',
    'Key points',
    `- Define the main idea behind ${topic}.`,
    '- Give one concrete example students can remember.',
    '- End with a short takeaway question for class discussion.',
  ].join('\n');
}

export function AiAssistantPanel({ open, onClose }: AiAssistantPanelProps) {
  const editor = useEditorRef();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    const block = editor.api.block();
    const existingText = block ? editor.api.string(block[0]) : '';

    await new Promise((resolve) => setTimeout(resolve, 600));

    const draft = buildAiDraft(prompt, existingText);
    const slashEntry = editor.api.above({ match: { type: KEYS.slashInput } });
    if (slashEntry) {
      editor.tf.removeNodes({ at: slashEntry[1] });
    }

    if (block && editor.api.isEmpty(block[0])) {
      editor.tf.insertNodes(
        {
          type: KEYS.p,
          children: [{ text: draft }],
        },
        { at: block[1], select: true },
      );
    } else {
      editor.tf.insertText(draft);
    }

    editor.tf.focus();
    setLoading(false);
    setPrompt('');
    onClose();
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[90] border-t border-[#e8ddd0] bg-[#faf6f1] p-3 shadow-lg"
      data-testid="ai-assistant-panel"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-[#2c1810]">
          <Sparkles className="h-4 w-4 text-[#8b6914]" />
          AI Assistant
        </div>
        <button
          type="button"
          aria-label="Close AI assistant"
          onClick={onClose}
          className="rounded p-1 text-[#6b5c52] hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleGenerate();
            }
            if (event.key === 'Escape') onClose();
          }}
          placeholder="Ask AI to draft, summarize, or explain..."
          className="flex-1 rounded-lg border border-[#e8ddd0] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d4c4b0]"
          data-testid="ai-assistant-input"
        />
        <button
          type="button"
          disabled={loading || !prompt.trim()}
          onClick={() => void handleGenerate()}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-[#2c1810] px-4 py-2 text-sm font-medium text-white transition-opacity',
            (loading || !prompt.trim()) && 'opacity-60',
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </button>
      </div>
      <p className="mt-2 text-xs text-[#6b5c52]">Press Ctrl+J anytime to open AI. Enter to generate.</p>
    </div>
  );
}
