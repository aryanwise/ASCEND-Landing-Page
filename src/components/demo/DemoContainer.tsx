'use client';
import { Home, Target, CheckSquare, MessageCircle, RotateCcw } from 'lucide-react';
import { useDemoState } from '@/lib/useDemoState';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { IntroScreen, PickAreaScreen, GoalTextScreen, AIDialogueScreen, PlanReviewScreen } from './SetupScreens';
import HomeScreen from './HomeScreen';
import GoalsScreen from './GoalsScreen';
import TodaysTasksScreen from './TodaysTasksScreen';
import CoachScreen from './CoachScreen';
import RecalibrateModal from './RecalibrateModal';
import type { AppTab } from '@/types';

interface DemoContainerProps {
  embedded?: boolean;
}

const TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: 'home',    label: 'Home',    icon: Home },
  { id: 'goals',   label: 'Goals',   icon: Target },
  { id: 'dayplan', label: 'Tasks',   icon: CheckSquare },
  { id: 'coach',   label: 'Coach',   icon: MessageCircle },
];

export default function DemoContainer({ embedded = false }: DemoContainerProps) {
  const d = useDemoState();
  const { state } = d;

  const isSetup = !['app', 'done'].includes(state.step);
  const recalibrateGoal = state.recalibrateGoalId ? state.goals.find(g => g.id === state.recalibrateGoalId) : null;

  const renderSetup = () => {
    switch (state.step) {
      case 'intro':
        return <IntroScreen onStart={() => d.setStep('pickArea')} />;
      case 'pickArea':
        return <PickAreaScreen selected={state.selectedArea} onPick={d.pickArea} onContinue={() => d.setStep('goalText')} />;
      case 'goalText':
        return <GoalTextScreen area={state.selectedArea!} text={state.goalText} onChange={d.setGoalText} onBack={() => d.setStep('pickArea')} onContinue={() => d.setStep('aiDialogue')} />;
      case 'aiDialogue':
        return (
          <AIDialogueScreen
            area={state.selectedArea!}
            goalText={state.goalText}
            messages={state.dialogueMessages}
            dialogueIndex={state.dialogueIndex}
            currentAnswer={state.currentAnswer}
            onAnswerChange={d.setCurrentAnswer}
            onAddMsg={d.addDialogueMsg}
            onAdvance={d.advanceDialogue}
            onPlanReady={(goal) => { d.addGoal(goal); d.setStep('planReview'); }}
          />
        );
      case 'planReview':
        return state.goals[0]
          ? <PlanReviewScreen goal={state.goals[0]} onSave={() => d.setStep('app')} />
          : null;
    }
  };

  const renderApp = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {state.activeTab === 'home' && (
          <HomeScreen
            goals={state.goals}
            priorities={state.priorities}
            completions={state.completions}
            dayPlan={state.dayPlan}
            dayPlanLoading={state.dayPlanLoading}
            energy={state.energy}
            onAddPriority={d.addPriority}
            onTogglePriority={d.togglePriority}
            onRemovePriority={d.removePriority}
            onToggleBlock={d.toggleDayBlock}
            onSetEnergy={d.setEnergy}
            onSetPlan={d.setDayPlan}
            onSetLoading={d.setDayPlanLoading}
          />
        )}
        {state.activeTab === 'goals' && (
          <GoalsScreen
            goals={state.goals}
            completions={state.completions}
            onOpenRecalibrate={d.openRecalibrate}
          />
        )}
        {state.activeTab === 'dayplan' && (
          <TodaysTasksScreen
            goals={state.goals}
            completions={state.completions}
            energy={state.energy}
            dayPlan={state.dayPlan}
            dayPlanLoading={state.dayPlanLoading}
            onToggleTask={d.toggleTask}
            onSetEnergy={d.setEnergy}
            onSetPlan={d.setDayPlan}
            onSetLoading={d.setDayPlanLoading}
            onToggleBlock={d.toggleDayBlock}
          />
        )}
        {state.activeTab === 'coach' && (
          <CoachScreen
            goals={state.goals}
            chat={state.chat}
            dayPlan={state.dayPlan}
            onAddChat={d.addChat}
            onUpdatePlan={(blocks) => d.setDayPlan({ ...state.dayPlan!, blocks })}
          />
        )}
        {/* Recalibrate modal — slides up over Goals tab */}
        {recalibrateGoal && state.recalibrateTaskId && (
          <RecalibrateModal
            goal={recalibrateGoal}
            taskId={state.recalibrateTaskId}
            chat={state.recalibrateChat}
            onAddChat={d.addRecalibrateChat}
            onApply={d.applyRecalibration}
            onClose={d.closeRecalibrate}
          />
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(26,24,21,0.08)', background: 'rgba(248,245,239,0.97)', flexShrink: 0, paddingBottom: 8 }}>
        {TABS.map(tab => {
          const active = state.activeTab === tab.id;
          const Icon = tab.icon;
          const hasWarning = tab.id === 'goals' &&
            state.goals.some(g => (g.missedDays ?? 0) >= 2 && !g.plan.dailyTasks.some(t => t.intervened));
          return (
            <button key={tab.id} onClick={() => d.setTab(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 10, paddingBottom: 4, background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              {hasWarning && (
                <div style={{ position: 'absolute', top: 8, right: '50%', marginRight: -14, width: 8, height: 8, borderRadius: '50%', background: '#D9531E', border: '1.5px solid #F8F5EF' }} />
              )}
              <Icon size={19} color={active ? '#D9531E' : '#A8A095'} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? '#D9531E' : '#A8A095', letterSpacing: '0.3px' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <PhoneFrame tilt={!embedded}>
        {isSetup ? renderSetup() : renderApp()}
      </PhoneFrame>
      {state.step !== 'intro' && (
        <button onClick={d.reset} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#A8A095', padding: '6px 12px' }}>
          <RotateCcw size={11} /> Restart demo
        </button>
      )}
    </div>
  );
}
