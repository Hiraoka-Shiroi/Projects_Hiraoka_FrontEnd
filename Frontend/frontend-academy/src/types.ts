export type LessonStatus = 'not_started' | 'in_progress' | 'awaiting_review' | 'passed' | 'repeat';
export interface Lesson {
  id: number;
  title: string;
  stage: string;
  goal: string;
  prerequisites: number[];
  concepts: string[];
  outcome: string;
  completion: string[];
}
export interface Stage {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  checkpoint: string;
  projectIds: string[];
}
export interface Exercise { id: string; title: string; instructions: string; checks: string[] }
export interface LessonContent {
  id: number;
  environment: string;
  connection: string;
  sections: { title: string; text: string; code?: string; explanation?: string }[];
  exercises: Exercise[];
  questions: string[];
  prediction: string;
  checklist: string[];
  reviewPolicy: string;
}
export interface GuidedStep {
  id: string;
  title: string;
  goal: string;
  text: string;
  code: string;
  lines: string[];
  tryIt: string;
  question: string;
  demo: string;
  result: string;
  trace: string[];
}
export interface ProjectBrief {
  id: string;
  title: string;
  stage: string;
  lessons: number[];
  summary: string;
  requirements: string[];
  scenarios: string[];
  acceptance: string[];
  architecture: string;
  steps: string[];
  skills: string[];
  checks: string[];
  readme: string[];
  deployment: string;
  demo: string[];
  quality: string[];
  extensions: string[];
}
export interface ReviewRecord {
  id: string;
  date: string;
  verdict: 'accepted' | 'revise';
  independent: boolean;
  explanation: string;
  corrections: string;
}
export interface LessonProgress {
  status: LessonStatus;
  notes: string;
  completedTasks: string[];
  mastery: 0 | 1 | 2 | 3 | 4;
  evidence: string;
  projectEvidence: string;
  weakPoints: string;
  repeatOn: string;
  reviews: ReviewRecord[];
  readingMode?: 'guided' | 'practice' | 'reference';
  readingStep?: number;
  stepDrafts?: Record<string, string>;
  selfChecks?: Record<string, { selected: number; attempts: number }>;
  historicalPassed?: boolean;
  bookmarked?: boolean;
}
export interface ProjectProgress {
  checked: string[];
  repo: string;
  demo: string;
  notes: string;
  review: string;
  active: boolean;
}
export interface AcademyProgress {
  schemaVersion: 1;
  updatedAt: string;
  lastLesson: number;
  goals: string;
  lessons: Record<string, LessonProgress>;
  projects: Record<string, ProjectProgress>;
}
