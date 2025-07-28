export interface AssessmentMetadata {
  version: string;
  lastUpdated: string;
  createdAt: string;
  createdBy?: string;
  category: string;
  tags?: string[];
}

export interface ValidationRule {
  type: 'required' | 'matrix_validation' | 'range' | 'pattern';
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  months?: number;
  elements?: MatrixElement[];
}

export interface MatrixElement {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'calculated_number' | 'text';
  required: boolean;
  formula?: string;
  maxScore?: number;
}

export interface MonthlyData {
  id: string;
  month: string;
  parentId: string;
  elements?: MatrixElement[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface SubQuestion {
  id: string;
  text: string;
  type: QuestionType;
  maxScore: number;
  weight: number;
  validation?: ValidationRule;
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export type QuestionType =
  | 'boolean'
  | 'composite'
  | 'text'
  | 'number'
  | 'choice'
  | 'rating'
  | 'date'
  | 'data_validation_matrix';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  maxScore: number;
  weight: number;
  required: boolean;
  helpText?: string;
  validation?: ValidationRule;
  options?: string[];
  subQuestions?: SubQuestion[];
  monthlyData?: MonthlyData[];
  instruction?: string;
  order?: number;
  correctAnswer?: any;
  expectedRating?: number;
  keywords?: string[];
  minLength?: number;
  maxLength?: number;
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface Category {
  id: string;
  name: string;
  maxScore: number;
  weight?: number;
  questions: Question[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface Subsection {
  id: string;
  title: string;
  maxScore: number;
  weight?: number;
  questions?: Question[];
  categories?: Category[];
  instruction?: string;
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  maxScore: number;
  weight: number;
  order?: number;
  questions?: Question[];
  subsections?: Subsection[];
  categories?: Category[];
  instruction?: string;
  metadata?: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface Assessment {
  id: string;
  departement: 'DPAL' | 'M&E';
  niveau: number;
  title: string;
  description?: string;
  maxScore: number;
  status?: 'draft' | 'published' | 'archived';
  metadata: AssessmentMetadata;
  sections: Section[];
}

export interface AssessmentFilter {
  status?: 'draft' | 'published' | 'archived';
  departement?: 'DPAL' | 'M&E';
  category?: string;
  searchTerm?: string;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: Partial<Assessment>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: string;
  };
}

// Extended question interface for quiz functionality
export interface QuizQuestion extends Question {
  sectionPath?: string[];
  sectionTitle?: string;
  containerTitle?: string;
  fullPath?: string;
  parentId?: string;
  isSubQuestion?: boolean;
  isMatrixData?: boolean;
}

// Response interfaces
export interface QuestionResponse {
  questionId: string;
  value: any;
  timestamp: Date;
  questionType: QuestionType;
}

export interface MatrixResponse {
  [monthId: string]: {
    rma_count?: number;
    recount?: number;
    ratio?: number;
    concordance?: boolean;
    [key: string]: any;
  };
}

export interface CompositeResponse {
  [subQuestionId: string]: any;
}

export type ResponseValue = boolean | string | number | CompositeResponse | MatrixResponse;

export interface AssessmentResponse {
  [questionId: string]: ResponseValue;
}
