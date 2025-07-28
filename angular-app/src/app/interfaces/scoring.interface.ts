export interface ScoreResult {
  id: string;
  score: number;
  maxScore: number;
  percentage: number;
  timestamp: string;
  metadata?: any;
}

export interface SectionScoreResult extends ScoreResult {
  title: string;
  weight?: number;
  questionResults?: ScoreResult[];
  nestedResults?: ScoreResult[];
}

export interface AssessmentScoreResult extends ScoreResult {
  assessmentId: string;
  assessmentTitle: string;
  grade: string;
  level: PerformanceLevel;
  sectionResults: SectionScoreResult[];
  responses: number;
  context?: ScoringContext;
}

export interface ScoreBreakdown {
  total: number;
  maxTotal: number;
  percentage: number;
  sections: SectionBreakdown[];
  breakdown: {
    bySection: SectionSummary[];
    byQuestionType: QuestionTypeStats;
    performance: PerformanceMetrics;
    recommendations: string[];
  };
}

export interface SectionBreakdown {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionsCount: number;
}

export interface SectionSummary {
  id: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionsCount: number;
}

export interface QuestionTypeStats {
  [questionType: string]: {
    total: number;
    answered: number;
    correct: number;
    totalScore: number;
    maxScore: number;
    answerRate: number;
    accuracy: number;
    scorePercentage: number;
  };
}

export interface PerformanceMetrics {
  overall: number;
  grade: string;
  level: PerformanceLevel;
  trend: 'improving' | 'stable' | 'declining';
}

export type PerformanceLevel =
  | 'Excellent'
  | 'Good'
  | 'Satisfactory'
  | 'Needs Improvement'
  | 'Unsatisfactory';

export interface ScoringContext {
  timeSpent?: number;
  startTime?: Date;
  endTime?: Date;
  userId?: string;
  sessionId?: string;
  strictMode?: boolean;
}

export interface ScoringOptions {
  strictMode: boolean;
  partialCredit: boolean;
  timeBasedScoring: boolean;
  weightedScoring: boolean;
  roundingPrecision: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  requiredQuestions: number;
  requiredAnswered: number;
}

export interface ValidationIssue {
  type: 'missing_required' | 'invalid_format' | 'out_of_range';
  questionId: string;
  path: string[];
  message: string;
}

export interface QuizProgress {
  answered: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export interface QuizSession {
  quizId: string;
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  maxScore: number;
  estimatedDuration: number;
  currentQuestionIndex: number;
  isCompleted: boolean;
}

export interface QuizResults {
  quizId: string;
  quizTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  sectionResults: SectionScoreResult[];
  questionsAnswered: number;
  totalQuestions: number;
  completionRate: number;
}

export interface DetailedAnalysis extends QuizResults {
  questionAnalysis: QuestionAnalysis[];
  timePerQuestion: TimeAnalysis;
  strengths: StrengthWeakness[];
  weaknesses: StrengthWeakness[];
}

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  questionType: string;
  required: boolean;
  answered: boolean;
  response: any;
  score: number;
  maxScore: number;
  sectionTitle: string;
}

export interface TimeAnalysis {
  total: number;
  average: number;
  perQuestion: number;
}

export interface StrengthWeakness {
  section: string;
  question: string;
  score: number;
  maxScore?: number;
  reason?: string;
}

export interface CompletionValidation {
  isComplete: boolean;
  missing: string[];
  totalRequired: number;
  completedRequired: number;
}
