'use client';
import { useState } from 'react';
import { Plus, CheckCircle2, Circle, X, RefreshCw, Loader2, Zap, Sparkles } from 'lucide-react';
import type { Goal, Priority, DayPlan } from '@/types';
import { generateDayPlan } from '@/lib/utils';

const CONSTRAINTS = [
  { id: 'tired',    label: '😴 Tired',         value: 'low energy, feeling tired' },
  { id: 'rushed',   label: '⚡ Short on time',  value: 'only 4 hours available' },
  { id: 'high',     label: '🔥 Full energy',    value: 'high energy, full day available' },
  { id: 'medium',   label: '🔋 Medium energy',  value: 'medium energy, 7 hours available' },
  { id: 'focus',    label: '🎯 Deep work day',  value: 'want to focus on study and deep work' },
  { id: 'recovery', label: '🌿 Recovery day',   value: 'body needs rest, light tasks only' },
];

interface HomeScreenProps {
  goals: Goal[];
  priorities: Priority[];
  completions: Record<string, Record<string, boolean>>;
  dayPlan: DayPlan | null;
  dayPlanLoading: boolean;
  energy: 'low' | 'medium' | 'high' | null;
  onAddPriority: (text: string) => void;
  onTogglePriority: (id: string) => void;
  onRemovePriority: (id: string) => void;
  onToggleBlock: (index: number) => void;
  onSetEnergy: (level: 'low' | 'medium' | 'high') => void;
  onSetPlan: (plan: DayPlan) => void;
  onSetLoading: (v: boolean) => void;
}

export default function HomeScreen({
  goals, priorities, completions, dayPlan, dayPlanLoading,
  onAddPriority, onTogglePriority, onRemovePriority, onToggleBlock,
  onSetEnergy, onSetPlan, onSetLoading,
}: HomeScreenProps) {
  const [newPri, setNewPri] = useState('');
  const [activeConstraint, setActiveConstraint] = useState<string | null>(null);

  const doneCount = dayPlan?.blocks.filter(b => b.done).length ?? 0;
  const totalCount = dayPlan?.blocks.length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const addPri = () => {
    if (!newPri.trim()) return;
    onAddPriority(newPri.trim());
    setNewPri('');
  };

  const generate = async (constraintId?: string) => {
    const c = CONSTRAINTS.find(x => x.id === constraintId);
    const energyLevel = (constraintId === 'tired' || constraintId === 'recovery') ? 'low'
      : constraintId === 'high' ? 'high' : 'medium';

    onSetEnergy(energyLevel);
    onSetLoading(true);

    const goalData = goals.map(g => ({
      title: g.title, area: g.area,
      tasks: g.plan.dailyTasks.map(t => t.name),
    }));

    const hours = constraintId === 'rushed' ? 4 : constraintId === 'tired' ? 5 : constraintId === 'high' ? 10 : 8;
    const energyStr = c ? c.value : 'medium energy, 8 hours available';

    try {
      const plan = await generateDayPlan(goalData, energyStr, hours);
      onSetPlan(plan);
    } catch {
      onSetLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header — ASCEND brand */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6B6359' }}>{greeting}</div>
          {/* ASCEND wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#D9531E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1 }}>A</span>
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: '#1A1815' }}>ASCEND</span>
          </div>
        </div>
        {dayPlan && (
          <div style={{ fontSize: 10, color: '#A8A095', marginBottom: 4 }}>
            {doneCount}/{totalCount} done
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px', overflowY: 'auto', flex: 1, paddingBottom: 16 }}>

        {/* Priorities */}
        <div style={{ marginBottom: 14 }}>
          <SLabel>Today's Priorities</SLabel>
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid rgba(26,24,21,0.08)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: priorities.length > 0 ? 10 : 0 }}>
              <input value={newPri} onChange={e => setNewPri(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPri()} placeholder="What MUST happen today?"
                style={{ flex: 1, padding: '8px 11px', borderRadius: 9, border: 'none', background: '#FBF9F4', fontSize: 12, color: '#1A1815', outline: 'none' }} />
              <button onClick={addPri} disabled={!newPri.trim()} style={{ width: 32, height: 32, borderRadius: 9, background: '#D9531E', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: newPri.trim() ? 1 : 0.4 }}>
                <Plus size={14} color="#fff" />
              </button>
            </div>
            {priorities.length === 0
              ? <div style={{ textAlign: 'center', fontSize: 11, color: '#A8A095', fontStyle: 'italic', padding: '4px 0' }}>Pin 1–3 must-dos. The rest is bonus.</div>
              : priorities.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, paddingTop: 9, borderTop: i > 0 ? '1px solid rgba(26,24,21,0.06)' : 'none' }}>
                    <button onClick={() => onTogglePriority(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {p.done ? <CheckCircle2 size={18} color="#D9531E" fill="#FFE9DD" /> : <Circle size={18} color="#A8A095" />}
                    </button>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? '#D9531E' : i === 1 ? '#B8721C' : '#A8A095', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>P{i + 1}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: p.done ? '#A8A095' : '#1A1815', textDecoration: p.done ? 'line-through' : 'none' }}>{p.text}</span>
                    <button onClick={() => onRemovePriority(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.35, padding: 3 }}>
                      <X size={13} />
                    </button>
                  </div>
                ))
            }
          </div>
        </div>

        {/* AI Day Plan section */}
        <SLabel>AI Day Plan</SLabel>

        {/* Constraint chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {CONSTRAINTS.map(c => (
            <button key={c.id} onClick={() => {
              setActiveConstraint(c.id);
              generate(c.id);
            }}
              style={{ padding: '5px 10px', borderRadius: 99, border: activeConstraint === c.id ? '1.5px solid #D9531E' : '1px solid rgba(26,24,21,0.1)', background: activeConstraint === c.id ? '#FFE9DD' : '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: activeConstraint === c.id ? '#D9531E' : '#6B6359', whiteSpace: 'nowrap' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {dayPlanLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 12 }}>
            <Loader2 size={22} color="#D9531E" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 12, color: '#6B6359', textAlign: 'center' }}>Building your day around your goals...</div>
          </div>
        )}

        {/* Empty state */}
        {!dayPlanLoading && !dayPlan && (
          <div style={{ background: '#FFE9DD', borderRadius: 14, padding: '16px', border: '1px solid rgba(217,83,30,0.15)', textAlign: 'center' }}>
            <Sparkles size={20} color="#D9531E" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#B33E0E', marginBottom: 6 }}>Let AI plan your day</div>
            <div style={{ fontSize: 11, color: '#B33E0E', marginBottom: 12, lineHeight: 1.5 }}>Pick a constraint above or tap generate — Ascend builds a realistic time-blocked schedule around your goals.</div>
            <button onClick={() => generate('medium')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D9531E', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Zap size={13} /> Generate day plan
            </button>
          </div>
        )}

        {/* Day plan blocks */}
        {!dayPlanLoading && dayPlan && (
          <>
            {/* AI advice banner */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 10, border: '1px solid rgba(26,24,21,0.08)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Sparkles size={12} color="#D9531E" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#6B6359', lineHeight: 1.5 }}>{dayPlan.advice}</span>
            </div>

            {dayPlan.blocks.map((block, i) => (
              <button key={i} onClick={() => onToggleBlock(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: block.done ? '#FBF9F4' : '#fff', border: '1px solid rgba(26,24,21,0.08)', borderRadius: 12, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ textAlign: 'right', width: 38, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#A8A095' }}>{block.time}</span>
                </div>
                <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: block.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: block.done ? '#A8A095' : '#1A1815', textDecoration: block.done ? 'line-through' : 'none' }}>{block.task}</div>
                  <div style={{ fontSize: 10, color: '#A8A095', marginTop: 2 }}>
                    <span style={{ background: block.soft, color: block.color, padding: '1px 5px', borderRadius: 4, fontWeight: 700, marginRight: 5 }}>{block.area}</span>
                    {block.duration}
                  </div>
                </div>
                {block.done
                  ? <CheckCircle2 size={15} style={{ color: block.color, flexShrink: 0 }} fill={block.soft} />
                  : <Circle size={15} color="#A8A095" style={{ flexShrink: 0 }} />}
              </button>
            ))}

            {/* Deferred */}
            {dayPlan.deferred.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', margin: '10px 0 6px' }}>Deferred (honest)</div>
                {dayPlan.deferred.map((d, i) => (
                  <div key={i} style={{ background: '#FBF9F4', borderRadius: 10, padding: '8px 12px', marginBottom: 5, border: '1px solid rgba(26,24,21,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6359', textDecoration: 'line-through' }}>{d.task}</div>
                    <div style={{ fontSize: 10, color: '#A8A095', marginTop: 2 }}>{d.reason}</div>
                  </div>
                ))}
              </>
            )}

            <button onClick={() => generate(activeConstraint ?? undefined)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(26,24,21,0.1)', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#6B6359' }}>
              <RefreshCw size={11} /> Regenerate
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', marginBottom: 8 }}>{children}</div>;
}