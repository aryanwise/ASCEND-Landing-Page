'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight, ChevronLeft, Send, Loader2, CheckCircle2, Clock, Sparkle } from 'lucide-react';
import { AREAS } from '@/data/areas';
import { DIALOGUE_QUESTIONS, DIALOGUE_SYSTEM, PLAN_TEMPLATE_BY_AREA } from '@/data/scripts';
import { askGroq, formatFrequency } from '@/lib/utils';
import type { AreaId, Goal, DialogueMessage } from '@/types';

/* ─── INTRO ─────────────────────────────────────────────── */
export function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px', textAlign: 'center' }}>

      {/* Disclaimer banner */}
      <div style={{ width: '100%', background: '#1A1815', borderRadius: 14, padding: '12px 16px', marginBottom: 28, textAlign: 'left' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#D9531E', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          ⚠️ Demo Notice
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
          This demo uses <strong style={{ color: '#fff' }}>pre-built scripts</strong> to simulate the experience. The real Ascend replaces all of this with live AI — personalised to your goals, history, and patterns.
        </p>
      </div>

      {/* Badge */}
      <div style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFE9DD', borderRadius: 99, padding: '6px 14px' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D9531E', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#D9531E' }}>Interactive Demo</span>
      </div>

      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#1A1815', marginBottom: 10, lineHeight: 1.15 }}>
        Try Ascend.<br />No signup needed.
      </h2>

      <p style={{ fontSize: 13, color: '#6B6359', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
        Create a real goal, get an AI-built plan, miss a task, and watch Ascend recalibrate — in under 2 minutes.
      </p>

      <button onClick={onStart} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#D9531E', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(217,83,30,0.35)' }}>
        <Sparkles size={16} /> Start the demo
      </button>

      <p style={{ marginTop: 14, fontSize: 10, color: '#A8A095' }}>No data saved · Refreshes reset the demo</p>
    </div>
  );
}

/* ─── PICK AREA ──────────────────────────────────────────── */
export function PickAreaScreen({ selected, onPick, onContinue }: { selected: AreaId | null; onPick: (a: AreaId) => void; onContinue: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 16px 0' }}>
      <StepHeader step={1} of={3} title="Pick a life area" sub="One goal per area keeps you focused." />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {AREAS.map(a => {
            const sel = selected === a.id;
            return (
              <button key={a.id} onClick={() => onPick(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 12, border: sel ? `2px solid ${a.color}` : '1px solid rgba(26,24,21,0.08)', background: sel ? a.soft : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>{a.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sel ? a.color : '#1A1815' }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <BottomBar>
        <ContinueBtn disabled={!selected} onClick={onContinue} label="Continue" />
      </BottomBar>
    </div>
  );
}

/* ─── GOAL TEXT ──────────────────────────────────────────── */
const PLACEHOLDERS: Partial<Record<AreaId, string>> = {
  fitness: 'e.g. Get to 85kg from 97kg by August. Autoimmune issues — no heavy lifting.',
  study: 'e.g. Pass AWS Solutions Architect in 3 months. Full-time job, ~1hr/day evenings.',
  career: 'e.g. Land a senior role in 6 months. Mid-level now, want more autonomy and pay.',
};
export function GoalTextScreen({ area, text, onChange, onBack, onContinue }: { area: AreaId; text: string; onChange: (v: string) => void; onBack: () => void; onContinue: () => void }) {
  const a = AREAS.find(x => x.id === area)!;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 16px 0' }}>
      <StepHeader step={2} of={3} title="What do you actually want?" sub="Include real constraints — they make the plan honest." />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 10px', background: a.soft, borderRadius: 10 }}>
          <span style={{ fontSize: 18 }}>{a.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.label}</span>
        </div>
        <textarea value={text} onChange={e => onChange(e.target.value)} placeholder={PLACEHOLDERS[area] ?? 'Describe your goal including real constraints...'} rows={6}
          style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(26,24,21,0.1)', background: '#fff', fontSize: 13, color: '#1A1815', resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />
      </div>
      <BottomBar>
        <BackBtn onClick={onBack} />
        <ContinueBtn disabled={!text.trim()} onClick={onContinue} label="Continue" />
      </BottomBar>
    </div>
  );
}

/* ─── AI DIALOGUE ────────────────────────────────────────── */
export function AIDialogueScreen({ area, goalText, messages, dialogueIndex, currentAnswer, onAnswerChange, onAddMsg, onAdvance, onPlanReady }: {
  area: AreaId; goalText: string; messages: DialogueMessage[]; dialogueIndex: number; currentAnswer: string;
  onAnswerChange: (v: string) => void; onAddMsg: (m: DialogueMessage) => void; onAdvance: () => void; onPlanReady: (g: Goal) => void;
}) {
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const questions = DIALOGUE_QUESTIONS[area];
  const initialized = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  useEffect(() => {
    if (initialized.current || messages.length > 0) return;
    initialized.current = true;
    setThinking(true);
    askGroq({ system: DIALOGUE_SYSTEM(area, goalText), messages: [], intent: `dialogue_${area}` })
      .then(q => { onAddMsg({ role: 'assistant', content: q }); })
      .catch(() => { onAddMsg({ role: 'assistant', content: questions[0] }); })
      .finally(() => setThinking(false));
  }, []);

  const userCount = messages.filter(m => m.role === 'user').length;

  const send = async () => {
    if (!currentAnswer.trim() || thinking) return;
    const answer = currentAnswer.trim();
    onAddMsg({ role: 'user', content: answer });
    onAdvance();
    setThinking(true);

    const nextIndex = dialogueIndex + 1;
    if (nextIndex < questions.length) {
      const history = [...messages, { role: 'user' as const, content: answer }];
      askGroq({ system: DIALOGUE_SYSTEM(area, goalText), messages: history, intent: `dialogue_${area}` })
        .then(q => onAddMsg({ role: 'assistant', content: q }))
        .catch(() => onAddMsg({ role: 'assistant', content: questions[nextIndex] ?? questions[questions.length - 1] }))
        .finally(() => setThinking(false));
    } else {
      // Build plan
      setTimeout(() => {
        const tmpl = PLAN_TEMPLATE_BY_AREA[area];
        const goal: Goal = {
          id: `goal-${Date.now()}`,
          area,
          title: tmpl.title,
          createdAt: new Date().toISOString(),
          plan: {
            title: tmpl.title,
            summary: tmpl.summary,
            duration: tmpl.duration,
            milestones: [],
            dailyTasks: tmpl.tasks.map(t => ({ ...t, category: 'habit' })),
            tips: ['Consistency over intensity — show up even on low-energy days.', 'Track outcomes, not just effort.'],
          },
        };
        onPlanReady(goal);
        setThinking(false);
      }, 1000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid rgba(26,24,21,0.06)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6B6359' }}>Step 3 of 3</div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1A1815', marginTop: 2 }}>Honest dialogue</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, background: '#FFE9DD', borderRadius: 99, padding: '4px 10px', width: 'fit-content' }}>
          <Sparkles size={10} color="#D9531E" />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#D9531E' }}>Question {Math.min(userCount + 1, questions.length)} of {questions.length}</span>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '84%', padding: '10px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? '#1A1815' : '#fff', border: m.role === 'assistant' ? '1px solid rgba(26,24,21,0.08)' : 'none', fontSize: 13, color: m.role === 'user' ? '#fff' : '#1A1815', lineHeight: 1.5 }}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#A8A095', fontSize: 12 }}>
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            {userCount >= questions.length ? 'Building your plan...' : 'Thinking...'}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid rgba(26,24,21,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={currentAnswer} onChange={e => onAnswerChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Your honest answer..." disabled={thinking}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 99, border: '1px solid rgba(26,24,21,0.1)', background: '#fff', fontSize: 13, color: '#1A1815', outline: 'none' }} />
        <button onClick={send} disabled={!currentAnswer.trim() || thinking}
          style={{ width: 38, height: 38, borderRadius: '50%', background: '#D9531E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!currentAnswer.trim() || thinking) ? 0.4 : 1 }}>
          <Send size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ─── PLAN REVIEW ────────────────────────────────────────── */
export function PlanReviewScreen({ goal, onSave }: { goal: Goal; onSave: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CheckCircle2 size={14} color="#1B7A5C" />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1B7A5C' }}>Plan ready · built around your constraints</span>
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: '#1A1815', lineHeight: 1.15 }}>{goal.plan.title}</div>
        <div style={{ marginTop: 6, fontSize: 12, color: '#6B6359', lineHeight: 1.6, fontStyle: 'italic' }}>"{goal.plan.summary}"</div>
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFE9DD', borderRadius: 99, padding: '4px 10px' }}>
          <Clock size={10} color="#D9531E" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#D9531E' }}>{goal.plan.duration}</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        <SLabel>Daily plan</SLabel>
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(26,24,21,0.08)', marginBottom: 14 }}>
          {goal.plan.dailyTasks.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderTop: i > 0 ? '1px solid rgba(26,24,21,0.06)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D9531E', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1815' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#A8A095' }}>{formatFrequency(t.frequency)}{t.duration ? ` · ${t.duration}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
        {goal.plan.tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, background: '#FFE9DD', padding: '10px 12px', borderRadius: 10 }}>
            <Sparkle size={11} color="#D9531E" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#1A1815', lineHeight: 1.55 }}>{tip}</span>
          </div>
        ))}
      </div>
      <BottomBar>
        <button onClick={onSave} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#D9531E', color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Start using Ascend <ArrowRight size={15} />
        </button>
      </BottomBar>
    </div>
  );
}

/* ─── SHARED SUBCOMPONENTS ───────────────────────────────── */
function StepHeader({ step, of, title, sub }: { step: number; of: number; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 14, flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {Array.from({ length: of }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? '#D9531E' : '#E5DECC' }} />
        ))}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6B6359' }}>Step {step} of {of}</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1A1815', marginTop: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#6B6359', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function BottomBar({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(26,24,21,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>{children}</div>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '11px 14px', borderRadius: 12, border: '1px solid rgba(26,24,21,0.1)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1A1815' }}>
      <ChevronLeft size={14} /> Back
    </button>
  );
}

function ContinueBtn({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#D9531E', color: '#fff', border: 'none', borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: disabled ? 0.4 : 1 }}>
      {label} <ArrowRight size={14} />
    </button>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', marginBottom: 8 }}>{children}</div>;
}
