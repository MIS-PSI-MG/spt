
// =============================================================================
// EDITOR INTERFACES - Content Structure Only (No Scoring)
// =============================================================================

export namespace Editor {
    export interface ValidationRule {
      type: "required" | "matrix_validation" | "min_value" | "max_value";
      minValue?: number;
      maxValue?: number;
      months?: number;
      elements?: ValidationElement[];
    }
  
    export interface ValidationElement {
      id: string;
      name: string;
      type: "number" | "calculated_number" | "boolean" | "text";
      formula?: string;
      required: boolean;
    }
  
    export interface SubQuestion {
      id: string;
      text: string;
      type: "boolean" | "number" | "text";
    }
  
    export interface MonthlyDataTemplate {
      id: string;
      month: string;
      parentId: string;
    }
  
    export interface Question {
      id: string;
      text: string;
      type: "boolean" | "number" | "text" | "composite" | "data_validation_matrix";
      required?: boolean;
      validation?: ValidationRule;
      subQuestions?: SubQuestion[];
      monthlyData?: MonthlyDataTemplate[];
      instruction?: string;
    }
  
    export interface Category {
      id: string;
      name: string;
      questions: Question[];
    }
  
    export interface Subsection {
      id: string;
      title: string;
      instruction?: string;
      questions?: Question[];
      categories?: Category[];
    }
  
    export interface Section {
      id: string;
      title: string;
      subsections?: Subsection[];
      questions?: Question[];
    }
  
    export interface Metadata {
      version: string;
      lastUpdated: string;
      category: string;
      author?: string;
      description?: string;
    }
  
    export interface ChecklistTemplate {
      id: string;
      departement: string;
      niveau: number;
      title: string;
      metadata: Metadata;
      sections: Section[];
    }
  
    export type ChecklistCollection = ChecklistTemplate[];
  }