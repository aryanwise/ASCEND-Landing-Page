'use client';
import { useState } from 'react';
import { Plus, CheckCircle2, Circle, X, RefreshCw, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { Goal, Priority, DayPlan } from '@/types';
import { generateDayPlan } from '@/lib/utils';

// ── Questionnaire options ──────────────────────────────────
const ENERGY_OPTIONS = [
  { id: 'low',    label: '🪫 Low',    desc: 'Running on empty' },
  { id: 'medium', label: '🔋 Medium', desc: 'Decent, not peak'  },
  { id: 'high',   label: '⚡ High',   desc: 'Locked in'        },
];

const HOURS_OPTIONS = [
  { id: '3',  label: '< 4 hrs' },
  { id: '5',  label: '4–6 hrs' },
  { id: '7',  label: '6–8 hrs' },
  { id: '10', label: 'Full day' },
];

const MOOD_OPTIONS = [
  { id: 'tired',    label: '😴 Need easy wins',  context: 'feeling tired, need small manageable wins' },
  { id: 'focus',    label: '🎯 Deep focus',       context: 'want long uninterrupted deep work blocks' },
  { id: 'rushed',   label: '⚡ Short on time',    context: 'tight schedule, keep everything under 30 min' },
  { id: 'recovery', label: '🌿 Recovery mode',    context: 'body needs rest, light tasks only' },
  { id: 'other',    label: '✏️ Other',             context: '' },
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

  // Generation form state
  const [formOpen, setFormOpen] = useState(false);
  const [selEnergy, setSelEnergy] = useState<string | null>(null);
  const [selHours, setSelHours] = useState<string | null>(null);
  const [selMood, setSelMood]   = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  const doneCount  = dayPlan?.blocks.filter(b => b.done).length ?? 0;
  const totalCount = dayPlan?.blocks.length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const canGenerate = true;

  const generate = async () => {
    if (!canGenerate) return;
    const energyLevel = (selEnergy ?? 'medium') as 'low' | 'medium' | 'high';
    onSetEnergy(energyLevel);
    onSetLoading(true);
    setFormOpen(false);

    const moodCtx = selMood === 'other'
      ? otherText.trim()
      : MOOD_OPTIONS.find(m => m.id === selMood)?.context ?? '';

    const contextStr = (selEnergy || selHours || selMood)
      ? `${energyLevel} energy, ${selHours ? selHours + ' hours available' : 'standard hours'}, ${moodCtx}`
      : 'balanced day, standard energy, no specific constraints — use your best judgment';

    const goalData = goals.map(g => ({
      title: g.title, area: g.area,
      tasks: g.plan.dailyTasks.map(t => t.name),
    }));
    try {
      const plan = await generateDayPlan(goalData, contextStr, parseInt(selHours ?? '8'));
      onSetPlan(plan);
    } catch {
      onSetLoading(false);
    }
  };

  const addPri = () => {
    if (!newPri.trim()) return;
    onAddPriority(newPri.trim());
    setNewPri('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#6B6359' }}>{greeting}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#D9531E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>A</span>
            </div>
            <span style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: '#1A1815' }}>ASCEND</span>
          </div>
        </div>
        {dayPlan && <div style={{ fontSize: 10, color: '#A8A095', marginBottom: 4 }}>{doneCount}/{totalCount} done</div>}
      </div>

      <div style={{ padding: '0 16px', overflowY: 'auto', flex: 1, paddingBottom: 16 }}>

        {/* ── Priorities ─────────────────────────────── */}
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

        {/* ── AI Day Plan ────────────────────────────── */}
        <SLabel>AI Day Plan</SLabel>

        {/* Loading */}
        {dayPlanLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 20px', gap: 12 }}>
            <Loader2 size={22} color="#D9531E" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 12, color: '#6B6359', textAlign: 'center' }}>Building your day around your goals and mood...</div>
          </div>
        )}

        {/* Generation form — collapsed into one card */}
        {!dayPlanLoading && (
          <div style={{ background: !dayPlan ? '#fff' : '#FBF9F4', borderRadius: 16, border: !dayPlan ? '1.5px dashed rgba(217,83,30,0.3)' : '1px solid rgba(26,24,21,0.08)', marginBottom: dayPlan ? 12 : 0, overflow: 'hidden' }}>

            {/* Collapsed trigger */}
            <button onClick={() => setFormOpen(f => !f)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFE9DD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={16} color="#D9531E" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1815' }}>{dayPlan ? 'Regenerate Day Plan' : 'Generate Day Plan'}</div>
                  <div style={{ fontSize: 10, color: '#6B6359', marginTop: 1 }}>
                    {dayPlan ? 'Adjust based on how you feel now' : 'Tap to generate · Questions are optional'}
                  </div>
                </div>
              </div>
              {formOpen ? <ChevronUp size={15} color="#A8A095" /> : <ChevronDown size={15} color="#A8A095" />}
            </button>

            {/* Expanded form */}
            {formOpen && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(26,24,21,0.06)', animation: 'fadeIn 0.2s' }}>

                {/* Q1: Energy */}
                <div style={{ marginTop: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1815', marginBottom: 8 }}>1. How's your energy right now?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ENERGY_OPTIONS.map(e => (
                      <button key={e.id} onClick={() => setSelEnergy(e.id)}
                        style={{ flex: 1, padding: '10px 6px', borderRadius: 11, border: selEnergy === e.id ? '1.5px solid #D9531E' : '1px solid rgba(26,24,21,0.1)', background: selEnergy === e.id ? '#FFE9DD' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 14, marginBottom: 3 }}>{e.label.split(' ')[0]}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: selEnergy === e.id ? '#D9531E' : '#1A1815' }}>{e.label.split(' ').slice(1).join(' ')}</div>
                        <div style={{ fontSize: 9, color: '#A8A095', marginTop: 2 }}>{e.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2: Time */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1815', marginBottom: 8 }}>2. How many hours do you actually have?</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {HOURS_OPTIONS.map(h => (
                      <button key={h.id} onClick={() => setSelHours(h.id)}
                        style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: selHours === h.id ? '1.5px solid #D9531E' : '1px solid rgba(26,24,21,0.1)', background: selHours === h.id ? '#FFE9DD' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: selHours === h.id ? '#D9531E' : '#6B6359' }}>
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3: Mood / constraint */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1815', marginBottom: 8 }}>3. Anything specific about today?</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {MOOD_OPTIONS.map(m => (
                      <button key={m.id} onClick={() => setSelMood(m.id)}
                        style={{ padding: '7px 10px', borderRadius: 99, border: selMood === m.id ? '1.5px solid #D9531E' : '1px solid rgba(26,24,21,0.1)', background: selMood === m.id ? '#FFE9DD' : '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: selMood === m.id ? '#D9531E' : '#6B6359', whiteSpace: 'nowrap' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {selMood === 'other' && (
                    <textarea value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="What else is going on today? (e.g. I have a big presentation at 3pm, feeling anxious about it)" rows={2}
                      style={{ width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(26,24,21,0.1)', background: '#FBF9F4', fontSize: 12, color: '#1A1815', outline: 'none', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }} />
                  )}
                </div>

                {/* Generate button */}
                <button onClick={generate}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', background: '#D9531E', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <Sparkles size={14} />
                  {dayPlan ? 'Regenerate with this context' : 'Generate Day Plan'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Day plan blocks */}
        {!dayPlanLoading && dayPlan && !formOpen && (
          <>
            {/* AI advice */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', marginBottom: 10, border: '1px solid rgba(26,24,21,0.08)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Sparkles size={12} color="#D9531E" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#6B6359', lineHeight: 1.5 }}>{dayPlan.advice}</span>
            </div>

            {/* Disclaimer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFE9DD', borderRadius: 99, padding: '5px 12px', marginBottom: 10, width: 'fit-content' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D9531E', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#D9531E', letterSpacing: '0.5px' }}>
                DEMO · Real app syncs your Goals + Google Calendar for full context
              </span>
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

            {dayPlan.deferred.length > 0 && (
              <>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', margin: '10px 0 6px' }}>Deferred — honest</div>
                {dayPlan.deferred.map((d, i) => (
                  <div key={i} style={{ background: '#FBF9F4', borderRadius: 10, padding: '8px 12px', marginBottom: 5, border: '1px solid rgba(26,24,21,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6359', textDecoration: 'line-through' }}>{d.task}</div>
                    <div style={{ fontSize: 10, color: '#A8A095', marginTop: 2 }}>{d.reason}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', marginBottom: 8 }}>{children}</div>;
}