import { Observable } from 'rxjs';
import {
  Assessment,
  AssessmentFilter,
  AssessmentTemplate,
  Question,
  Section,
  Subsection,
  Category,
  SubQuestion,
  MonthlyData,
  QuizQuestion,
  AssessmentResponse,
  ResponseValue
} from './assessment.interface';
import {
  QuizSession,
  QuizResults,
  DetailedAnalysis,
  QuizProgress,
  CompletionValidation,
  ScoreBreakdown,
  AssessmentScoreResult,
  ScoringOptions,
  ValidationResult
} from './scoring.interface';

// Backoffice Content Service Interface
export interface IBackofficeContentService {
  // Assessment Management
  createAssessment(assessmentData: Partial<Assessment>): Observable<Assessment>;
  updateAssessment(assessmentId: string, updates: Partial<Assessment>): Observable<Assessment>;
  getAssessment(assessmentId: string): Observable<Assessment>;
  getAllAssessments(filters?: AssessmentFilter): Observable<Assessment[]>;
  deleteAssessment(assessmentId: string): Observable<boolean>;
  publishAssessment(assessmentId: string): Observable<Assessment>;
  archiveAssessment(assessmentId: string): Observable<Assessment>;

  // Section Management
  addSection(assessmentId: string, sectionData: Partial<Section>): Observable<Section>;
  updateSection(assessmentId: string, sectionId: string, updates: Partial<Section>): Observable<Section>;
  deleteSection(assessmentId: string, sectionId: string): Observable<boolean>;
  reorderSections(assessmentId: string, sectionIds: string[]): Observable<Section[]>;

  // Subsection Management
  addSubsection(assessmentId: string, sectionId: string, subsectionData: Partial<Subsection>): Observable<Subsection>;
  updateSubsection(assessmentId: string, subsectionId: string, updates: Partial<Subsection>): Observable<Subsection>;
  deleteSubsection(assessmentId: string, subsectionId: string): Observable<boolean>;

  // Category Management
  addCategory(assessmentId: string, parentId: string, categoryData: Partial<Category>): Observable<Category>;
  updateCategory(assessmentId: string, categoryId: string, updates: Partial<Category>): Observable<Category>;
  deleteCategory(assessmentId: string, categoryId: string): Observable<boolean>;

  // Question Management
  addQuestion(assessmentId: string, containerId: string, questionData: Partial<Question>, containerType?: string): Observable<Question>;
  updateQuestion(assessmentId: string, questionId: string, updates: Partial<Question>): Observable<Question>;
  deleteQuestion(assessmentId: string, questionId: string): Observable<boolean>;
  reorderQuestions(assessmentId: string, containerId: string, questionIds: string[]): Observable<Question[]>;

  // Sub-question Management
  addSubQuestion(assessmentId: string, parentQuestionId: string, subQuestionData: Partial<SubQuestion>): Observable<SubQuestion>;
  updateSubQuestion(assessmentId: string, subQuestionId: string, updates: Partial<SubQuestion>): Observable<SubQuestion>;
  deleteSubQuestion(assessmentId: string, subQuestionId: string): Observable<boolean>;

  // M&E Matrix Management
  createMatrixQuestion(assessmentId: string, containerId: string, matrixQuestionData: Partial<Question>): Observable<Question>;
  addMatrixData(assessmentId: string, parentQuestionId: string, matrixData: Partial<MonthlyData>): Observable<MonthlyData>;
  updateMatrixData(assessmentId: string, matrixDataId: string, updates: Partial<MonthlyData>): Observable<MonthlyData>;
  deleteMatrixData(assessmentId: string, matrixDataId: string): Observable<boolean>;

  // Template Management
  createTemplate(templateData: Partial<AssessmentTemplate>): Observable<AssessmentTemplate>;
  getTemplates(category?: string): Observable<AssessmentTemplate[]>;
  getTemplate(templateId: string): Observable<AssessmentTemplate>;
  updateTemplate(templateId: string, updates: Partial<AssessmentTemplate>): Observable<AssessmentTemplate>;
  deleteTemplate(templateId: string): Observable<boolean>;
  createAssessmentFromTemplate(templateId: string, assessmentData: Partial<Assessment>): Observable<Assessment>;

  // Import/Export
  exportAssessment(assessmentId: string, format?: 'json' | 'csv'): Observable<string>;
  importAssessment(data: string | File, format?: 'json' | 'csv'): Observable<Assessment>;
  validateAssessmentStructure(data: any): Observable<ValidationResult>;

  // Utility Methods
  duplicateAssessment(assessmentId: string, newTitle?: string): Observable<Assessment>;
  getAssessmentStatistics(assessmentId: string): Observable<AssessmentStatistics>;
  searchContent(query: string, filters?: ContentSearchFilters): Observable<SearchResult[]>;
}

// Quiz Service Interface
export interface IQuizService {
  // Quiz Session Management
  startQuiz(assessmentId: string): Observable<QuizSession>;
  loadQuizContent(assessmentId: string): Observable<QuizContent>;
  resumeQuiz(sessionId: string): Observable<QuizSession>;
  pauseQuiz(sessionId: string): Observable<boolean>;
  completeQuiz(sessionId: string): Observable<QuizResults>;
  abandonQuiz(sessionId: string): Observable<boolean>;

  // Response Management
  submitResponse(sessionId: string, questionId: string, response: ResponseValue): Observable<ResponseSubmissionResult>;
  updateResponse(sessionId: string, questionId: string, response: ResponseValue): Observable<ResponseSubmissionResult>;
  getResponse(sessionId: string, questionId: string): Observable<ResponseValue>;
  getAllResponses(sessionId: string): Observable<AssessmentResponse>;
  clearResponse(sessionId: string, questionId: string): Observable<boolean>;

  // Navigation
  getCurrentQuestion(sessionId: string): Observable<QuizQuestion>;
  getNextQuestion(sessionId: string): Observable<QuizQuestion>;
  getPreviousQuestion(sessionId: string): Observable<QuizQuestion>;
  goToQuestion(sessionId: string, questionId: string): Observable<QuizQuestion>;
  getQuestionByIndex(sessionId: string, index: number): Observable<QuizQuestion>;

  // Progress and Validation
  getProgress(sessionId: string): Observable<QuizProgress>;
  validateCompleteness(sessionId: string): Observable<CompletionValidation>;
  validateResponse(questionId: string, response: ResponseValue): Observable<ValidationResult>;
  getCurrentScore(sessionId: string): Observable<number>;

  // Results and Analytics
  getQuizResults(sessionId: string): Observable<QuizResults>;
  getDetailedAnalysis(sessionId: string): Observable<DetailedAnalysis>;
  exportResults(sessionId: string, format?: 'json' | 'csv' | 'pdf'): Observable<string>;
  compareResults(sessionIds: string[]): Observable<ResultsComparison>;

  // Question Management
  getAllQuestions(sessionId: string): Observable<QuizQuestion[]>;
  getQuestionById(sessionId: string, questionId: string): Observable<QuizQuestion>;
  getQuestionsBySection(sessionId: string, sectionId: string): Observable<QuizQuestion[]>;
  searchQuestions(sessionId: string, query: string): Observable<QuizQuestion[]>;

  // Utility Methods
  estimateCompletionTime(assessmentId: string): Observable<number>;
  getQuizStatistics(assessmentId: string): Observable<QuizStatistics>;
  saveProgress(sessionId: string): Observable<boolean>;
  getSessionHistory(userId?: string): Observable<QuizSession[]>;
}

// Score Calculator Service Interface
export interface IScoreCalculatorService {
  // Score Calculation
  calculateQuestionScore(question: Question, response: ResponseValue, options?: ScoringOptions): Observable<number>;
  calculateSectionScore(section: Section, responses: AssessmentResponse, options?: ScoringOptions): Observable<number>;
  calculateAssessmentScore(assessment: Assessment, responses: AssessmentResponse, options?: ScoringOptions): Observable<AssessmentScoreResult>;
  calculatePercentageScore(score: number, maxScore: number, precision?: number): number;

  // Matrix Scoring (M&E specific)
  calculateMatrixScore(question: Question, responses: any): Observable<number>;
  validateMatrixData(question: Question, responses: any): Observable<ValidationResult>;

  // Score Analysis
  getScoreBreakdown(assessment: Assessment, responses: AssessmentResponse, options?: ScoringOptions): Observable<ScoreBreakdown>;
  getPerformanceMetrics(results: AssessmentScoreResult): Observable<PerformanceMetrics>;
  generateRecommendations(results: AssessmentScoreResult): Observable<string[]>;
  compareScores(results: AssessmentScoreResult[]): Observable<ScoreComparison>;

  // Configuration
  setScoringOptions(options: Partial<ScoringOptions>): void;
  getScoringOptions(): ScoringOptions;
  resetToDefaults(): void;
}

// Supporting Interfaces
export interface QuizContent {
  assessment: Assessment;
  questions: QuizQuestion[];
  totalQuestions: number;
  maxScore: number;
  estimatedDuration: number;
}

export interface ResponseSubmissionResult {
  questionId: string;
  accepted: boolean;
  currentScore: number;
  progress: QuizProgress;
  validation?: ValidationResult;
}

export interface AssessmentStatistics {
  totalQuestions: number;
  questionsByType: { [type: string]: number };
  totalSections: number;
  averageTimeToComplete: number;
  completionRate: number;
  averageScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizStatistics {
  totalAttempts: number;
  completionRate: number;
  averageScore: number;
  averageTime: number;
  commonMistakes: string[];
  bestPerformingSections: string[];
  worstPerformingSections: string[];
}

export interface ContentSearchFilters {
  departement?: string;
  questionType?: string;
  difficulty?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  type: 'assessment' | 'section' | 'question';
  departement: string;
  relevanceScore: number;
  highlightedText: string;
  path: string[];
}

export interface ResultsComparison {
  sessions: string[];
  comparisons: {
    scores: number[];
    percentages: number[];
    completionTimes: number[];
    sectionComparisons: SectionComparison[];
  };
  insights: string[];
}

export interface SectionComparison {
  sectionId: string;
  sectionTitle: string;
  scores: number[];
  percentages: number[];
  improvements: string[];
}

export interface ScoreComparison {
  baseline: AssessmentScoreResult;
  comparisons: AssessmentScoreResult[];
  improvements: {
    overall: number;
    bySection: { [sectionId: string]: number };
  };
  regressions: {
    overall: number;
    bySection: { [sectionId: string]: number };
  };
  recommendations: string[];
}

export interface PerformanceMetrics {
  overall: number;
  grade: string;
  level: string;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  weaknesses: string[];
  timeEfficiency: number;
  consistency: number;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
  message?: string;
}

// Event Interfaces for Real-time Updates
export interface QuizEvent {
  type: 'response_submitted' | 'question_changed' | 'quiz_completed' | 'progress_updated';
  sessionId: string;
  data: any;
  timestamp: Date;
}

export interface ContentEvent {
  type: 'assessment_created' | 'assessment_updated' | 'assessment_deleted' | 'question_added' | 'question_updated';
  assessmentId: string;
  userId: string;
  data: any;
  timestamp: Date;
}
