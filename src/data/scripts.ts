import type { Goal, AreaId } from '@/types';

// 3-question dialogue per area (shorter = snappier demo)
export const DIALOGUE_QUESTIONS: Record<AreaId, string[]> = {
  fitness: [
    "What's your honest starting point — current weight, fitness level, and any injuries or health conditions I should know about?",
    "How many days per week can you realistically train? And what time of day works best for your energy?",
    "You've probably tried this before. What made it stick, and what made it fall apart?",
  ],
  study: [
    "What's your current knowledge level, and what's the specific outcome — an exam, a job, a project?",
    "How many hours per week can you genuinely commit, factoring in your actual schedule?",
    "What killed the momentum last time you tried to learn this?",
  ],
  career: [
    "Where are you now and where specifically do you want to be in 12 months — title, skills, income, or something else?",
    "How many hours per week can you invest outside your current job without burning out?",
    "What's the real bottleneck — skills, visibility, network, or clarity on what you want?",
  ],
  diet: [
    "What does your current eating actually look like — be honest, not aspirational?",
    "What are the hard constraints — allergies, family meals, work schedule, budget?",
    "What's triggered the rebound every other time you've tried to change this?",
  ],
  mind: [
    "What's the specific mental state you're trying to fix — anxiety, focus, stress, sleep quality, or something else?",
    "How much time per day can you realistically dedicate to this without it feeling like a chore?",
    "Have you tried meditation or journaling before? What worked briefly and what didn't stick?",
  ],
  money: [
    "What's your honest financial picture right now — income, savings, biggest spending leak?",
    "How much can you realistically save per month without affecting essentials?",
    "What's triggered the spending or derailed savings attempts before?",
  ],
  health: [
    "What's the specific health thing you're working on — sleep, energy, a condition, or general vitality?",
    "What does your sleep and daily energy actually look like right now?",
    "What's made past attempts to fix this unsustainable?",
  ],
  habits: [
    "Which specific habit are you building or breaking, and why does it matter to you right now?",
    "When in your day does this habit naturally fit — morning, after work, before bed?",
    "How long has it lasted before when you've tried? What broke the streak?",
  ],
  custom: [
    "Describe what you're trying to do and why it matters, including the real constraints.",
    "How much time per week can you dedicate to this realistically?",
    "What's made similar goals hard to stick with before?",
  ],
};

// Groq system prompt for dialogue
export const DIALOGUE_SYSTEM = (area: string, goalText: string) => `You are Ascend, an AI cognitive partner helping someone plan a real goal.

AREA: ${area}
GOAL: ${goalText}

You're currently in the discovery phase — asking one question at a time to understand their real constraints before building a plan.

Rules:
- Ask ONE question per response, maximum 25 words
- Be direct, specific, and honest — not generic
- No preamble, no "great answer!", no filler
- Your question should dig into the REAL constraint, not the aspirational version

Just ask the question. Nothing else.`;

// Groq system prompt for recalibration
export const RECALIBRATE_SYSTEM = (goalTitle: string, taskName: string, tags: string[]) =>
  `You are Ascend, a cognitive partner. The user has missed "${taskName}" (part of their goal: "${goalTitle}") twice in a row.

Their stated reasons: ${tags.join(', ')}.

Your job: propose ONE specific, compassionate plan change. Be concrete — give an actual modified schedule or frequency, not vague advice.

Rules:
- 2-3 sentences max
- Start with brief empathy (1 sentence), then the proposal
- Be specific: "3x per week instead of daily" not "try doing it less often"
- End with "Want me to update your plan?" 
- No bullet points, no headers, just direct prose`;

// Groq system prompt for coach chat
export const COACH_SYSTEM = (goals: Goal[]) => {
  const goalList = goals.map(g =>
    `- [${g.area}] ${g.title}: tasks include ${g.plan.dailyTasks.slice(0, 3).map(t => t.name).join(', ')}`
  ).join('\n');

  return `You are Ascend, an AI cognitive partner. You know the user's real goals and their history.

THEIR ACTIVE GOALS:
${goalList || '(no goals yet)'}

Rules:
- Be direct, honest, and specific — never generic
- Reference their actual goals and tasks by name
- 3-4 sentences max
- No bullet points, no numbered lists, flowing prose only
- If they're struggling, propose ONE concrete change
- Never moralize or lecture`;
};

// Pre-seeded study goal (shown with ⚠️ warning — 2 missed days)
// Using Study area so it doesn't duplicate with a user-created Fitness goal
export const SEEDED_STUDY_GOAL: Goal = {
  id: 'demo-study-seeded',
  area: 'study',
  title: 'AWS Solutions Architect Cert',
  missedDays: 2,
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  plan: {
    title: 'AWS Solutions Architect Cert',
    summary: 'A focused 10-week sprint for a working professional. Active recall and practice exams over passive reading.',
    duration: '10 weeks',
    milestones: [
      { week: 3,  title: 'Core services locked',  metric: 'Pass 3 mock sections without notes' },
      { week: 6,  title: 'Architecture patterns', metric: '80%+ on practice exams' },
      { week: 10, title: 'Exam ready',             metric: 'Pass the certification' },
    ],
    dailyTasks: [
      { id: 'study-s-1', name: 'Study session',       frequency: 'weekly:Mon,Tue,Wed,Thu,Fri', duration: '60 min', category: 'study'   },
      { id: 'study-s-2', name: 'Practice questions',  frequency: 'weekly:3x',                  duration: '30 min', category: 'study'   },
      { id: 'study-s-3', name: 'Weekly review',       frequency: 'weekly:Sun',                 duration: '20 min', category: 'study'   },
    ],
    tips: [
      'After a long workday review what you know — save new material for weekend mornings when you\'re fresh.',
      'Teach what you learned to someone. If you can\'t explain it simply, you don\'t know it yet.',
    ],
  },
};

// Plan template per area (used if user skips through dialogue quickly)
export const PLAN_TEMPLATE_BY_AREA: Record<AreaId, { title: string; summary: string; duration: string; tasks: Array<{ id: string; name: string; frequency: string; duration: string }> }> = {
  fitness: {
    title: 'Sustainable Strength Build',
    summary: 'A realistic plan respecting your energy and constraints. Consistency over intensity.',
    duration: '12 weeks',
    tasks: [
      { id: 't-f-1', name: 'Training session',  frequency: 'weekly:3x', duration: '45 min' },
      { id: 't-f-2', name: 'Daily steps (8k)',  frequency: 'daily',     duration: 'all day' },
      { id: 't-f-3', name: 'Log food',          frequency: 'daily',     duration: '5 min'  },
    ],
  },
  study: {
    title: 'Deep Focus Learning Sprint',
    summary: 'Active recall and project-based learning over passive reading. Built for a busy schedule.',
    duration: '10 weeks',
    tasks: [
      { id: 't-s-1', name: 'Focused study block', frequency: 'weekly:Mon,Wed,Fri', duration: '60 min' },
      { id: 't-s-2', name: 'Practice problems',   frequency: 'weekly:3x',          duration: '30 min' },
      { id: 't-s-3', name: 'Weekly review',        frequency: 'weekly:Sun',         duration: '20 min' },
    ],
  },
  career: {
    title: 'Strategic Career Leverage',
    summary: 'Compounding moves: visible work, network surface area, and skill differentiation.',
    duration: '16 weeks',
    tasks: [
      { id: 't-c-1', name: 'Deep work block',     frequency: 'weekly:Mon,Wed,Fri', duration: '90 min' },
      { id: 't-c-2', name: 'One outreach message', frequency: 'daily',             duration: '10 min' },
      { id: 't-c-3', name: 'Ship something public', frequency: 'weekly:1x',        duration: '2 hr'   },
    ],
  },
  diet: { title: 'Real-Life Nutrition Reset', summary: 'Principles over restriction. Built around your actual life.', duration: '8 weeks', tasks: [{ id: 't-d-1', name: 'Protein-first breakfast', frequency: 'daily', duration: '15 min' }, { id: 't-d-2', name: 'Drink 2-3L water', frequency: 'daily', duration: 'all day' }] },
  mind: { title: 'Grounded Daily Practice', summary: 'Minimalist approach designed to survive the days you don\'t feel like it.', duration: '8 weeks', tasks: [{ id: 't-m-1', name: 'Morning meditation', frequency: 'daily', duration: '10 min' }, { id: 't-m-2', name: 'Evening journal', frequency: 'daily', duration: '5 min' }] },
  money: { title: 'Build the Financial Floor', summary: 'Automation and behavior, not budgeting apps you\'ll stop opening.', duration: '12 weeks', tasks: [{ id: 't-mo-1', name: 'Daily account check', frequency: 'daily', duration: '2 min' }, { id: 't-mo-2', name: 'Weekly money review', frequency: 'weekly:Sun', duration: '20 min' }] },
  health: { title: 'Foundational Health Repair', summary: 'Sleep, sunlight, movement — the leverage points that affect everything.', duration: '10 weeks', tasks: [{ id: 't-h-1', name: 'Bed by 10:30pm', frequency: 'daily', duration: 'discipline' }, { id: 't-h-2', name: 'Morning sunlight', frequency: 'daily', duration: '10 min' }] },
  habits: { title: 'One Habit, Fully Installed', summary: 'Tiny inputs, daily check-in, a single anchor you can\'t skip.', duration: '8 weeks', tasks: [{ id: 't-ha-1', name: 'Do the habit (min dose)', frequency: 'daily', duration: '5 min' }, { id: 't-ha-2', name: 'Log it', frequency: 'daily', duration: '10 sec' }] },
  custom: { title: 'Your Custom Plan', summary: 'A flexible structure built around the specific goal you described.', duration: '10 weeks', tasks: [{ id: 't-cu-1', name: 'Daily focused work', frequency: 'daily', duration: '30 min' }, { id: 't-cu-2', name: 'Weekly review', frequency: 'weekly:Sun', duration: '15 min' }] },
};
