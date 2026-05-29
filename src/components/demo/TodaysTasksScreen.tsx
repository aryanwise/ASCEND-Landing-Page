'use client';
import { useState } from 'react';
import { CheckCircle2, Circle, Sparkles, Loader2, RefreshCw, Zap } from 'lucide-react';
import type { Goal, DayPlan } from '@/types';
import { areaById } from '@/data/areas';
import { generateDayPlan } from '@/lib/utils';

interface TodaysTasksScreenProps {
  goals: Goal[];
  completions: Record<string, Record<string, boolean>>;
  energy: 'low' | 'medium' | 'high' | null;
  dayPlan: DayPlan | null;
  dayPlanLoading: boolean;
  onToggleTask: (goalId: string, taskId: string) => void;
  onSetEnergy: (level: 'low' | 'medium' | 'high') => void;
  onSetPlan: (plan: DayPlan) => void;
  onSetLoading: (v: boolean) => void;
  onToggleBlock: (index: number) => void;
}

const HOURS_MAP = { low: 5, medium: 8, high: 10 };

export default function TodaysTasksScreen({
  goals, completions, energy, dayPlan, dayPlanLoading,
  onToggleTask, onSetEnergy, onSetPlan, onSetLoading, onToggleBlock
}: TodaysTasksScreenProps) {
  const [view, setView] = useState<'tasks' | 'dayplan'>('tasks');

  const allTasks = goals.flatMap(g =>
    g.plan.dailyTasks.map(t => ({ goal: g, task: t, done: completions[g.id]?.[t.id] ?? false }))
  );
  const doneCount = allTasks.filter(t => t.done).length;

  const generatePlan = async () => {
    if (!energy) return;
    onSetLoading(true);
    setView('dayplan');
    const goalData = goals.map(g => ({
      title: g.title, area: g.area,
      tasks: g.plan.dailyTasks.map(t => t.name),
    }));
    try {
      const plan = await generateDayPlan(goalData, energy, HOURS_MAP[energy]);
      onSetPlan(plan);
    } catch {
      onSetLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: '#1A1815' }}>Today's Tasks</div>
        <div style={{ fontSize: 11, color: '#6B6359', marginTop: 2 }}>{doneCount} of {allTasks.length} done</div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, margin: '0 16px 12px', background: '#EBE5D6', borderRadius: 10, padding: 3, flexShrink: 0 }}>
        <button onClick={() => setView('tasks')} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: view === 'tasks' ? '#fff' : 'transparent', color: view === 'tasks' ? '#1A1815' : '#6B6359', boxShadow: view === 'tasks' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
          ✓ Tasks
        </button>
        <button onClick={() => setView('dayplan')} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: view === 'dayplan' ? '#fff' : 'transparent', color: view === 'dayplan' ? '#1A1815' : '#6B6359', boxShadow: view === 'dayplan' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
          🗓 Day Plan
        </button>
      </div>

      {/* TASKS VIEW */}
      {view === 'tasks' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {allTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: 12, color: '#A8A095' }}>Create a goal to see your tasks here.</div>
          ) : (
            <>
              {goals.map(g => {
                const a = areaById(g.area);
                return (
                  <div key={g.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <span style={{ fontSize: 14 }}>{a.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: a.color }}>{g.title}</span>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 13, overflow: 'hidden', border: '1px solid rgba(26,24,21,0.08)' }}>
                      {g.plan.dailyTasks.map((task, i) => {
                        const done = completions[g.id]?.[task.id] ?? false;
                        return (
                          <button key={task.id} onClick={() => onToggleTask(g.id, task.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', width: '100%', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid rgba(26,24,21,0.06)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
                            {done
                              ? <CheckCircle2 size={18} style={{ color: a.color, flexShrink: 0 }} fill={a.soft} />
                              : <Circle size={18} color="#A8A095" style={{ flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: done ? '#A8A095' : '#1A1815', textDecoration: done ? 'line-through' : 'none' }}>{task.name}</div>
                              {task.duration && <div style={{ fontSize: 10, color: '#A8A095', marginTop: 1 }}>{task.duration}</div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Generate day plan CTA */}
              <div style={{ background: '#FFE9DD', borderRadius: 13, padding: '13px 14px', border: '1px solid rgba(217,83,30,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#B33E0E', marginBottom: 6 }}>✨ Get an AI-built day plan</div>
                <div style={{ fontSize: 11, color: '#B33E0E', marginBottom: 10, lineHeight: 1.5 }}>Tell us your energy and Ascend builds a realistic time-blocked schedule around your tasks.</div>
                {!energy ? (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#B33E0E', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Zap size={10} /> Energy today?
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['low', 'medium', 'high'] as const).map(e => (
                        <button key={e} onClick={() => { onSetEnergy(e); }} style={{ flex: 1, padding: '8px 4px', background: '#fff', border: 'none', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#1A1815' }}>
                          {e === 'low' ? '🪫' : e === 'medium' ? '🔋' : '⚡'} {e.charAt(0).toUpperCase() + e.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <button onClick={generatePlan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '11px', background: '#D9531E', color: '#fff', border: 'none', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Sparkles size={13} /> Generate my day plan
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* DAY PLAN VIEW */}
      {view === 'dayplan' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {dayPlanLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12 }}>
              <Loader2 size={24} color="#D9531E" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: 13, color: '#6B6359', textAlign: 'center' }}>Building your day around your goals and energy...</div>
            </div>
          )}

          {!dayPlanLoading && !dayPlan && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 13, color: '#6B6359', marginBottom: 16 }}>No day plan yet. Go to Tasks and tap "Generate my day plan".</div>
              <button onClick={() => setView('tasks')} style={{ background: '#D9531E', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                ← Back to tasks
              </button>
            </div>
          )}

          {!dayPlanLoading && dayPlan && (
            <>
              {/* Advice */}
              <div style={{ background: '#FFE9DD', borderRadius: 12, padding: '10px 12px', marginBottom: 12, display: 'flex', gap: 8 }}>
                <Zap size={12} color="#D9531E" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#B33E0E', lineHeight: 1.5 }}>{dayPlan.advice}</span>
              </div>

              {/* Regenerate */}
              <button onClick={generatePlan} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12, padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(26,24,21,0.1)', background: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#6B6359' }}>
                <RefreshCw size={11} /> Regenerate
              </button>

              {/* Time blocks */}
              {dayPlan.blocks.map((block, i) => (
                <button key={i} onClick={() => onToggleBlock(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: block.done ? '#FBF9F4' : '#fff', border: '1px solid rgba(26,24,21,0.08)', borderRadius: 12, padding: '11px 12px', marginBottom: 7, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ textAlign: 'right', width: 40, flexShrink: 0 }}>
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
                    ? <CheckCircle2 size={16} style={{ color: block.color, flexShrink: 0 }} fill={block.soft} />
                    : <Circle size={16} color="#A8A095" style={{ flexShrink: 0 }} />}
                </button>
              ))}

              {/* Deferred */}
              {dayPlan.deferred.length > 0 && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A8A095', margin: '8px 0' }}>Deferred (honest)</div>
                  {dayPlan.deferred.map((d, i) => (
                    <div key={i} style={{ background: '#FBF9F4', borderRadius: 10, padding: '9px 12px', marginBottom: 6, border: '1px solid rgba(26,24,21,0.06)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6359', textDecoration: 'line-through' }}>{d.task}</div>
                      <div style={{ fontSize: 10, color: '#A8A095', marginTop: 3 }}>{d.reason}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
