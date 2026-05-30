'use client';
import { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Loader2, Check, Command } from 'lucide-react';
import type { ChatMessage, Goal, DayPlan } from '@/types';
import { COACH_SYSTEM, MODIFY_SYSTEM } from '@/data/scripts';
import { askGroq } from '@/lib/utils';

interface CoachScreenProps {
  goals: Goal[];
  chat: ChatMessage[];
  dayPlan: DayPlan | null;
  onAddChat: (msg: ChatMessage) => void;
  onUpdatePlan: (updatedBlocks: DayPlan['blocks']) => void;
}

const getSuggestions = (goals: Goal[]) => {
  if (goals.filter(g => !g.paused).length === 0) {
    return [
      "Where should I start — fitness or study?",
      "How does Ascend actually work?",
      "What makes a good first goal?",
    ];
  }
  return [
    { text: "What pattern do you see in my goals?",     tag: null },
    { text: "I'm exhausted. What should I skip today?", tag: null },
    { text: "@modify make my workout shorter",          tag: '@modify' },
    { text: "Am I taking on too much right now?",       tag: null },
  ];
};

export default function CoachScreen({ goals, chat, dayPlan, onAddChat, onUpdatePlan }: CoachScreenProps) {
  const [input, setInput]               = useState('');
  const [thinking, setThinking]         = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [planUpdated, setPlanUpdated]   = useState(false);
  const [updateLabel, setUpdateLabel]   = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lock after 2 AI replies
  const assistantCount = chat.filter(m => m.role === 'assistant').length;
  const isLocked       = assistantCount >= 2;
  const showModifyNudge = assistantCount === 1;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, thinking]);

  useEffect(() => {
    if (!planUpdated) return;
    const t = setTimeout(() => setPlanUpdated(false), 4000);
    return () => clearTimeout(t);
  }, [planUpdated]);

  const handleInputChange = (val: string) => {
    setInput(val);
    setShowCommands(val.endsWith('@') || (val.includes('@') && !val.includes('@modify')));
  };

const selectCommand = () => {
  setInput('@modify ');
  setShowCommands(false);
  setTimeout(() => inputRef.current?.focus(), 50);
};

  const send = async (text: string) => {
    if (!text.trim() || thinking || isLocked) return;
    setInput('');
    setShowCommands(false);
    setPlanUpdated(false);
    onAddChat({ role: 'user', content: text.trim() });
    setThinking(true);

    const isModify = text.toLowerCase().includes('@modify');

    try {
      const system = isModify ? MODIFY_SYSTEM(goals, dayPlan) : COACH_SYSTEM(goals);
      const reply = await askGroq({
        system,
        messages: [...chat, { role: 'user', content: text.trim() }],
        intent: isModify ? 'modify' : 'coach',
      });

      if (isModify && reply.includes('PLAN_CHANGE:')) {
        const parts     = reply.split('PLAN_CHANGE:');
        const coachText = parts[0].trim();
        const directive = parts[1]?.trim() ?? '';
        const match     = directive.match(/^(\d+)\s*[→\->\s]+(.+?)\s*\(([^)]+)\)/);
        if (match && dayPlan) {
          const idx         = Math.min(parseInt(match[1]), dayPlan.blocks.length - 1);
          const newName     = match[2].trim();
          const newDuration = match[3].trim();
          const updated     = dayPlan.blocks.map((b, i) =>
            i === idx ? { ...b, task: newName, duration: newDuration } : b
          );
          onUpdatePlan(updated);
          setPlanUpdated(true);
          setUpdateLabel(`"${newName}" · ${newDuration}`);
        }
        onAddChat({ role: 'assistant', content: coachText || reply.split('PLAN_CHANGE:')[0].trim() });
      } else {
        onAddChat({ role: 'assistant', content: reply });
      }
    } catch {
      onAddChat({ role: 'assistant', content: "Can't reach the server right now. Try again in a moment." });
    } finally {
      setThinking(false);
    }
  };

  const suggestions = getSuggestions(goals);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(26,24,21,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: '#D9531E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={17} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, color: '#1A1815' }}>Coach</div>
          <div style={{ fontSize: 10, color: '#A8A095', marginTop: 1 }}>
            Knows your goals · type{' '}
            <code style={{ background: '#FFE9DD', color: '#D9531E', padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>@modify</code>
            {' '}to change your plan
          </div>
        </div>
      </div>

      {/* Plan updated toast */}
      {planUpdated && (
        <div style={{ margin: '8px 14px 0', display: 'flex', alignItems: 'center', gap: 7, background: '#D9F0E5', borderRadius: 10, padding: '9px 12px', border: '1px solid rgba(27,122,92,0.2)' }}>
          <Check size={13} color="#1B7A5C" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1B7A5C' }}>Plan updated</div>
            {updateLabel && <div style={{ fontSize: 10, color: '#1B7A5C', opacity: 0.8, marginTop: 1 }}>{updateLabel} — check Home</div>}
          </div>
        </div>
      )}

      {/* Chat */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chat.length === 0 && (
          <div>
            <div style={{ fontSize: 12, color: '#A8A095', marginBottom: 12, lineHeight: 1.5 }}>
              Direct. Honest. Knows your goals.
            </div>
            {(suggestions as (string | { text: string; tag: string | null })[]).map((s, i) => {
              const isObj = typeof s === 'object';
              const text  = isObj ? s.text : s;
              const tag   = isObj ? s.tag  : null;
              return (
                <button key={i} onClick={() => send(text)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '11px 12px', background: '#fff', border: '1px solid rgba(26,24,21,0.08)', borderRadius: 12, fontSize: 12, color: '#1A1815', cursor: 'pointer', marginBottom: 6 }}>
                  {tag === '@modify' && (
                    <span style={{ background: '#FFE9DD', color: '#D9531E', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                      @modify
                    </span>
                  )}
                  <span style={{ color: tag === '@modify' ? '#D9531E' : '#1A1815', fontWeight: tag === '@modify' ? 700 : 500 }}>
                    {tag ? text.replace('@modify ', '') : text}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {chat.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 24, height: 24, borderRadius: 7, background: '#D9531E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                <Sparkles size={11} color="#fff" />
              </div>
            )}
            <div style={{ maxWidth: '80%', padding: m.role === 'user' ? '10px 14px' : '11px 13px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.role === 'user' ? '#1A1815' : '#fff', border: m.role === 'assistant' ? '1px solid rgba(26,24,21,0.08)' : 'none', fontSize: 13, color: m.role === 'user' ? '#fff' : '#1A1815', lineHeight: 1.6 }}>
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: '#D9531E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={11} color="#fff" />
            </div>
            <div style={{ display: 'flex', gap: 4, padding: '10px 0' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8A095', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer — locked or open */}
      {isLocked ? (

        /* Locked: waitlist CTA */
        <div style={{ padding: '14px', borderTop: '1px solid rgba(26,24,21,0.06)', flexShrink: 0 }}>
          <div style={{ background: '#1A1815', borderRadius: 16, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6, fontFamily: 'Fraunces, serif' }}>
              Want unlimited coaching?
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.5 }}>
              This is a preview. The real Ascend knows your full history, patterns, and goals.
            </div>
            <a
              href="/#waitlist"
              style={{ display: 'block', background: '#D9531E', color: '#fff', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(217,83,30,0.35)' }}
            >
              Join the waitlist →
            </a>
          </div>
        </div>

      ) : (

        /* Open: normal input */
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(26,24,21,0.06)', position: 'relative', flexShrink: 0 }}>

          {/* @modify nudge after first answer */}
          {showModifyNudge && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, background: '#FFE9DD', borderRadius: 9, padding: '7px 10px' }}>
              <span style={{ fontSize: 11, color: '#B33E0E' }}>💡 Try</span>
              <code style={{ background: 'rgba(217,83,30,0.15)', color: '#D9531E', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>@modify</code>
              <span style={{ fontSize: 11, color: '#B33E0E' }}>to change your day plan</span>
            </div>
          )}

          {/* @ command dropdown */}
          {showCommands && (
            <div style={{ position: 'absolute', bottom: '100%', left: 14, right: 14, marginBottom: 6, background: '#fff', border: '1px solid rgba(26,24,21,0.12)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '8px 12px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', borderBottom: '1px solid rgba(26,24,21,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Command size={9} /> Commands
              </div>
              <button onClick={selectCommand} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ background: '#FFE9DD', color: '#D9531E', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, flexShrink: 0, marginTop: 1 }}>@modify</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1815' }}>Modify your day plan</div>
                  <div style={{ fontSize: 11, color: '#A8A095', marginTop: 2 }}>{goals.filter(g => !g.paused).length > 0
                      ? `e.g. "make my ${goals.filter(g => !g.paused)[0]?.plan?.dailyTasks?.[0]?.name?.toLowerCase() ?? 'workout'} shorter"`
                      : 'e.g. "make my workout only 20 min"'
                    }
                  </div>
                </div>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !showCommands) send(input);
                if (e.key === 'Escape') setShowCommands(false);
              }}
              placeholder="Ask anything. Type @ for commands."
              disabled={thinking}
              style={{ flex: 1, padding: '11px 14px', borderRadius: 24, border: '1px solid rgba(26,24,21,0.1)', background: '#fff', fontSize: 16, color: '#1A1815', outline: 'none' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              style={{ width: 42, height: 42, borderRadius: '50%', background: input.trim() && !thinking ? '#1A1815' : '#EBE5D6', border: 'none', cursor: input.trim() && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={14} color={input.trim() && !thinking ? '#fff' : '#A8A095'} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}