'use client';
import { useReducer, useCallback } from 'react';
import type { Goal, Priority, ChatMessage, DemoStep, AppTab, DialogueMessage, DayPlan, AreaId } from '@/types';
import { SEEDED_STUDY_GOAL } from '@/data/scripts';

interface DemoState {
  step: DemoStep;
  activeTab: AppTab;
  // Goal creation flow
  selectedArea: AreaId | null;
  goalText: string;
  dialogueMessages: DialogueMessage[];
  dialogueIndex: number;
  currentAnswer: string;
  // App state
  goals: Goal[];
  priorities: Priority[];
  completions: Record<string, Record<string, boolean>>; // goalId -> taskId -> done
  chat: ChatMessage[];
  dayPlan: DayPlan | null;
  dayPlanLoading: boolean;
  energy: 'low' | 'medium' | 'high' | null;
  // Recalibrate
  recalibrateGoalId: string | null;
  recalibrateTaskId: string | null;
  recalibrateChat: ChatMessage[];
  recalibrateApplied: boolean;
}

type Action =
  | { type: 'SET_STEP'; step: DemoStep }
  | { type: 'SET_TAB'; tab: AppTab }
  | { type: 'PICK_AREA'; area: AreaId }
  | { type: 'SET_GOAL_TEXT'; text: string }
  | { type: 'ADD_DIALOGUE_MSG'; msg: DialogueMessage }
  | { type: 'ADVANCE_DIALOGUE' }
  | { type: 'SET_CURRENT_ANSWER'; value: string }
  | { type: 'ADD_GOAL'; goal: Goal }
  | { type: 'ADD_PRIORITY'; text: string }
  | { type: 'TOGGLE_PRIORITY'; id: string }
  | { type: 'REMOVE_PRIORITY'; id: string }
  | { type: 'TOGGLE_TASK'; goalId: string; taskId: string }
  | { type: 'SET_ENERGY'; level: 'low' | 'medium' | 'high' }
  | { type: 'ADD_CHAT'; msg: ChatMessage }
  | { type: 'SET_DAY_PLAN'; plan: DayPlan }
  | { type: 'UPDATE_DAY_BLOCKS'; blocks: DayPlan['blocks'] }
  | { type: 'SET_DAY_PLAN_LOADING'; loading: boolean }
  | { type: 'TOGGLE_DAY_BLOCK'; index: number }
  | { type: 'OPEN_RECALIBRATE'; goalId: string; taskId: string }
  | { type: 'ADD_RECALIBRATE_CHAT'; msg: ChatMessage }
  | { type: 'APPLY_RECALIBRATION'; goalId: string; taskId: string; changes: Partial<{ name: string; frequency: string; duration: string }> }
  | { type: 'CLOSE_RECALIBRATE' }
  | { type: 'RESET' };

const initial: DemoState = {
  step: 'intro',
  activeTab: 'home',
  selectedArea: null,
  goalText: '',
  dialogueMessages: [],
  dialogueIndex: 0,
  currentAnswer: '',
  goals: [],
  priorities: [],
  completions: {},
  chat: [],
  dayPlan: null,
  dayPlanLoading: false,
  energy: null,
  recalibrateGoalId: null,
  recalibrateTaskId: null,
  recalibrateChat: [],
  recalibrateApplied: false,
};

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case 'SET_STEP': return { ...s, step: a.step };
    case 'SET_TAB': return { ...s, activeTab: a.tab };
    case 'PICK_AREA': return { ...s, selectedArea: a.area };
    case 'SET_GOAL_TEXT': return { ...s, goalText: a.text };
    case 'ADD_DIALOGUE_MSG': return { ...s, dialogueMessages: [...s.dialogueMessages, a.msg] };
    case 'ADVANCE_DIALOGUE': return { ...s, dialogueIndex: s.dialogueIndex + 1, currentAnswer: '' };
    case 'SET_CURRENT_ANSWER': return { ...s, currentAnswer: a.value };
    case 'ADD_GOAL':
      // When first goal is added, also seed the fitness goal with 2 misses (for demo)
      return {
        ...s,
        goals: s.goals.length === 0
          ? [a.goal, SEEDED_STUDY_GOAL]
          : [...s.goals.filter(g => g.id !== a.goal.id), a.goal],
      };
    case 'ADD_PRIORITY': {
      if (s.priorities.length >= 3) return s;
      return { ...s, priorities: [...s.priorities, { id: `p-${Date.now()}`, text: a.text, done: false }] };
    }
    case 'TOGGLE_PRIORITY':
      return { ...s, priorities: s.priorities.map(p => p.id === a.id ? { ...p, done: !p.done } : p) };
    case 'REMOVE_PRIORITY':
      return { ...s, priorities: s.priorities.filter(p => p.id !== a.id) };
    case 'TOGGLE_TASK': {
      const cur = s.completions[a.goalId]?.[a.taskId] ?? false;
      return {
        ...s,
        completions: {
          ...s.completions,
          [a.goalId]: { ...(s.completions[a.goalId] ?? {}), [a.taskId]: !cur },
        },
      };
    }
    case 'SET_ENERGY': return { ...s, energy: a.level };
    case 'ADD_CHAT': return { ...s, chat: [...s.chat, a.msg] };
    case 'SET_DAY_PLAN': return { ...s, dayPlan: a.plan, dayPlanLoading: false };
    case 'UPDATE_DAY_BLOCKS':
      if (!s.dayPlan) return s;
      return { ...s, dayPlan: { ...s.dayPlan, blocks: a.blocks } };
    case 'SET_DAY_PLAN_LOADING': return { ...s, dayPlanLoading: a.loading };
    case 'TOGGLE_DAY_BLOCK':
      if (!s.dayPlan) return s;
      return {
        ...s,
        dayPlan: {
          ...s.dayPlan,
          blocks: s.dayPlan.blocks.map((b, i) => i === a.index ? { ...b, done: !b.done } : b),
        },
      };
    case 'OPEN_RECALIBRATE':
      return { ...s, recalibrateGoalId: a.goalId, recalibrateTaskId: a.taskId, recalibrateChat: [] };
    case 'ADD_RECALIBRATE_CHAT':
      return { ...s, recalibrateChat: [...s.recalibrateChat, a.msg] };
    case 'APPLY_RECALIBRATION':
      return {
        ...s,
        goals: s.goals.map(g =>
          g.id === a.goalId
            ? {
                ...g,
                missedDays: 0,
                plan: {
                  ...g.plan,
                  dailyTasks: g.plan.dailyTasks.map(t =>
                    t.id === a.taskId ? { ...t, ...a.changes, intervened: true } : t
                  ),
                },
              }
            : g
        ),
        recalibrateApplied: true,
      };
    case 'CLOSE_RECALIBRATE':
      return { ...s, recalibrateGoalId: null, recalibrateTaskId: null };
    case 'RESET': return initial;
    default: return s;
  }
}

export function useDemoState() {
  const [state, dispatch] = useReducer(reducer, initial);

  return {
    state,
    setStep: useCallback((step: DemoStep) => dispatch({ type: 'SET_STEP', step }), []),
    setTab: useCallback((tab: AppTab) => dispatch({ type: 'SET_TAB', tab }), []),
    pickArea: useCallback((area: AreaId) => dispatch({ type: 'PICK_AREA', area }), []),
    setGoalText: useCallback((text: string) => dispatch({ type: 'SET_GOAL_TEXT', text }), []),
    addDialogueMsg: useCallback((msg: DialogueMessage) => dispatch({ type: 'ADD_DIALOGUE_MSG', msg }), []),
    advanceDialogue: useCallback(() => dispatch({ type: 'ADVANCE_DIALOGUE' }), []),
    setCurrentAnswer: useCallback((value: string) => dispatch({ type: 'SET_CURRENT_ANSWER', value }), []),
    addGoal: useCallback((goal: Goal) => dispatch({ type: 'ADD_GOAL', goal }), []),
    addPriority: useCallback((text: string) => dispatch({ type: 'ADD_PRIORITY', text }), []),
    togglePriority: useCallback((id: string) => dispatch({ type: 'TOGGLE_PRIORITY', id }), []),
    removePriority: useCallback((id: string) => dispatch({ type: 'REMOVE_PRIORITY', id }), []),
    toggleTask: useCallback((goalId: string, taskId: string) => dispatch({ type: 'TOGGLE_TASK', goalId, taskId }), []),
    setEnergy: useCallback((level: 'low' | 'medium' | 'high') => dispatch({ type: 'SET_ENERGY', level }), []),
    addChat: useCallback((msg: ChatMessage) => dispatch({ type: 'ADD_CHAT', msg }), []),
    setDayPlan: useCallback((plan: DayPlan) => dispatch({ type: 'SET_DAY_PLAN', plan }), []),
    setDayPlanLoading: useCallback((loading: boolean) => dispatch({ type: 'SET_DAY_PLAN_LOADING', loading }), []),
    toggleDayBlock: useCallback((index: number) => dispatch({ type: 'TOGGLE_DAY_BLOCK', index }), []),
    openRecalibrate: useCallback((goalId: string, taskId: string) => dispatch({ type: 'OPEN_RECALIBRATE', goalId, taskId }), []),
    addRecalibrateChat: useCallback((msg: ChatMessage) => dispatch({ type: 'ADD_RECALIBRATE_CHAT', msg }), []),
    applyRecalibration: useCallback((goalId: string, taskId: string, changes: Partial<{ name: string; frequency: string; duration: string }>) => dispatch({ type: 'APPLY_RECALIBRATION', goalId, taskId, changes }), []),
    closeRecalibrate: useCallback(() => dispatch({ type: 'CLOSE_RECALIBRATE' }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),
  };
}
