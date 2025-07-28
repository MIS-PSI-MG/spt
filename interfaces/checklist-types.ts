// TypeScript interfaces for Checklist System
// Separated into Editor (content structure) and Quiz (scoring) interfaces
import { Editor } from "./checklist.editor.interface";
import { Quiz } from "./Quiz.editor.interface";

// =============================================================================
// RESPONSE & ASSESSMENT INTERFACES
// =============================================================================

export interface QuestionResponse {
  questionId: string;
  value: boolean | number | string;
  subResponses?: Record<string, boolean | number | string>;
  monthlyResponses?: Record<string, Record<string, boolean | number | string>>;
  timestamp?: string;
}

export interface AssessmentResponse {
  assessmentId: string;
  responses: Record<string, QuestionResponse>;
  metadata?: {
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    duration?: number;
  };
}

// =============================================================================
// SCORING & ANALYSIS INTERFACES
// =============================================================================

export interface ScoreBreakdown {
  totalScore: number;
  maxScore: number;
  percentage: number;
  sectionScores: Record<string, {
    score: number;
    maxScore: number;
    percentage: number;
    subsectionScores?: Record<string, {
      score: number;
      maxScore: number;
      percentage: number;
    }>;
  }>;
}

export interface QuestionWithPath {
  question: Quiz.Question;
  path: {
    assessmentId: string;
    sectionId: string;
    subsectionId?: string;
    categoryId?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  missingRequired: string[];
  errors: ValidationError[];
  warnings?: string[];
}

export interface ValidationError {
  questionId: string;
  message: string;
  type: "required" | "invalid_value" | "missing_subquestion" | "validation_failed";
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type QuestionType = "boolean" | "number" | "text" | "composite" | "data_validation_matrix";
export type ValidationType = "required" | "matrix_validation" | "min_value" | "max_value";
export type ResponseValue = boolean | number | string;

// Type guards
export const isEditorQuestion = (question: any): question is Editor.Question => {
  return question && typeof question.id === 'string' && !('maxScore' in question);
};

export const isQuizQuestion = (question: any): question is Quiz.Question => {
  return question && typeof question.id === 'string' && 'maxScore' in question;
};

// Conversion utilities
export type EditorToQuizConverter<T extends Editor.ChecklistTemplate> = {
  convertToQuiz(template: T, scoringRules?: ScoringRules): Quiz.ChecklistItem;
};

export interface ScoringRules {
  defaultQuestionScore?: number;
  defaultWeight?: number;
  sectionWeights?: Record<string, number>;
  questionScores?: Record<string, number>;
}
