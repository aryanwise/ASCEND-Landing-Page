'use client';
import { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Loader2, Check } from 'lucide-react';
import type { ChatMessage, Goal, DayPlan } from '@/types';
import { COACH_SYSTEM } from '@/data/scripts';
import { askGroq } from '@/lib/utils';

interface CoachScreenProps {
  goals: Goal[];
  chat: ChatMessage[];
  dayPlan: DayPlan | null;
  onAddChat: (msg: ChatMessage) => void;
  onUpdatePlan: (updatedBlocks: DayPlan['blocks']) => void;
}

const SUGGESTIONS = [
  "What pattern do you see in my goals?",
  "I'm exhausted — what should I skip today?",
  "@modify make my workout shorter",
  "Which goal should I focus on most?",
];

// System prompt for @modify — tells AI to output a plan change
const MODIFY_SYSTEM = (goals: Goal[], plan: DayPlan | null) => {
  const goalList = goals.map(g =>
    `[${g.area}] ${g.title}: ${g.plan.dailyTasks.map(t => t.name).join(', ')}`
  ).join('\n');

  const planBlocks = plan?.blocks.map((b, i) =>
    `[${i}] ${b.time} — ${b.task} (${b.duration}, ${b.area})`
  ).join('\n') ?? '(no plan generated yet)';

  return `You are Ascend's plan modifier. The user wants to modify their current day plan.

ACTIVE GOALS:
${goalList}

CURRENT DAY PLAN (with index numbers):
${planBlocks}

Rules:
- Acknowledge the request in 1 sentence
- Make the specific change they asked for
- Output EXACTLY this line at the end (no extra text after it):
PLAN_CHANGE: [block index] → [new task name] ([new duration])
- If no specific block applies, change index 0
- Keep it to 2-3 sentences total`;
};

export default function CoachScreen({ goals, chat, dayPlan, onAddChat, onUpdatePlan }: CoachScreenProps) {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [planUpdated, setPlanUpdated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, thinking]);

  // Show command dropdown when user types @
  const handleInputChange = (val: string) => {
    setInput(val);
    setShowCommands(val.includes('@') && !val.includes('@modify '));
  };

  const selectCommand = (cmd: string) => {
    setInput(cmd + ' ');
    setShowCommands(false);
  };

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    setInput('');
    setShowCommands(false);
    setPlanUpdated(false);
    onAddChat({ role: 'user', content: text.trim() });
    setThinking(true);

    const isModify = text.toLowerCase().includes('@modify');

    try {
      const system = isModify
        ? MODIFY_SYSTEM(goals, dayPlan)
        : COACH_SYSTEM(goals);

      const reply = await askGroq({
        system,
        messages: [...chat, { role: 'user', content: text.trim() }],
        intent: isModify ? 'modify' : 'coach',
      });

      // Parse PLAN_CHANGE: directive
      if (isModify && reply.includes('PLAN_CHANGE:')) {
        const directive = reply.split('PLAN_CHANGE:')[1].trim();
        // e.g. "2 → New task name (30 min)"
        const match = directive.match(/^(\d+)\s*→\s*(.+?)\s*\(([^)]+)\)/);
        if (match && dayPlan) {
          const idx = parseInt(match[1]);
          const newName = match[2].trim();
          const newDuration = match[3].trim();
          const updated = dayPlan.blocks.map((b, i) =>
            i === idx ? { ...b, task: newName, duration: newDuration } : b
          );
          onUpdatePlan(updated);
          setPlanUpdated(true);
        }
        // Show reply without the directive line
        const cleanReply = reply.replace(/PLAN_CHANGE:.*$/m, '').trim();
        onAddChat({ role: 'assistant', content: cleanReply });
      } else {
        onAddChat({ role: 'assistant', content: reply });
      }
    } catch {
      onAddChat({ role: 'assistant', content: 'Connection issue — try again in a moment.' });
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(26,24,21,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#D9531E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={17} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, color: '#1A1815' }}>Coach</div>
          <div style={{ fontSize: 10, color: '#6B6359', marginTop: 1 }}>⚖️ Balanced · type <code style={{ background: '#EBE5D6', padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>@modify</code> to change your plan</div>
        </div>
      </div>

      {/* Plan updated toast */}
      {planUpdated && (
        <div style={{ margin: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 6, background: '#D9F0E5', borderRadius: 9, padding: '8px 12px', border: '1px solid rgba(27,122,92,0.2)', animation: 'fadeIn 0.3s' }}>
          <Check size={13} color="#1B7A5C" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1B7A5C' }}>Plan updated — check Home to see the change</span>
        </div>
      )}

      {/* Chat */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chat.length === 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#A8A095', marginBottom: 10 }}>Ask anything. Type <strong>@modify</strong> to change your plan directly.</div>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: '#fff', border: '1px solid rgba(26,24,21,0.08)', borderRadius: 11, fontSize: 12, color: '#1A1815', cursor: 'pointer', marginBottom: 6 }}>
                {s.startsWith('@') ? <span style={{ color: '#D9531E', fontWeight: 700 }}>{s}</span> : s}
              </button>
            ))}
          </div>
        )}

        {chat.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '86%', padding: '10px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? '#1A1815' : '#fff', border: m.role === 'assistant' ? '1px solid rgba(26,24,21,0.08)' : 'none', fontSize: 13, color: m.role === 'user' ? '#fff' : '#1A1815', lineHeight: 1.55 }}>
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A8A095', fontSize: 12 }}>
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            {input.toLowerCase().includes('@modify') ? 'Modifying your plan...' : 'Thinking...'}
          </div>
        )}
      </div>

      {/* Input with @command dropdown */}
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(26,24,21,0.06)', position: 'relative', flexShrink: 0 }}>
        {showCommands && (
          <div style={{ position: 'absolute', bottom: '100%', left: 14, right: 14, background: '#fff', border: '1px solid rgba(26,24,21,0.12)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: 6 }}>
            <div style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', borderBottom: '1px solid rgba(26,24,21,0.06)' }}>Commands</div>
            <button onClick={() => selectCommand('@modify')} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <code style={{ fontSize: 12, fontWeight: 700, color: '#D9531E', background: '#FFE9DD', padding: '2px 6px', borderRadius: 5 }}>@modify</code>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1815' }}>Modify your plan</div>
                <div style={{ fontSize: 10, color: '#A8A095' }}>e.g. @modify make my workout only 20 minutes</div>
              </div>
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !showCommands && send(input)}
            placeholder="Be honest. Ask anything. Or type @ for commands."
            disabled={thinking}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 99, border: '1px solid rgba(26,24,21,0.1)', background: '#fff', fontSize: 13, color: '#1A1815', outline: 'none' }} />
          <button onClick={() => send(input)} disabled={!input.trim() || thinking}
            style={{ width: 38, height: 38, borderRadius: '50%', background: '#D9531E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || thinking) ? 0.4 : 1 }}>
            <Send size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}