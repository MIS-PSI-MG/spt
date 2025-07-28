import { Editor } from "./checklist.editor.interface";
// =============================================================================
// QUIZ INTERFACES - Parsed Content with Scoring
// =============================================================================

export namespace Quiz {
    export interface ValidationRule extends Editor.ValidationRule {
      // Inherits from Editor but can add quiz-specific validation
    }
  
    export interface ValidationElement extends Editor.ValidationElement {
      maxScore?: number;
      score:number;
    }
  
    export interface SubQuestion extends Editor.SubQuestion {
      maxScore: number;
      weight: number;
      score: number;
    }
  
    export interface MonthlyData extends Editor.MonthlyDataTemplate {
      // Inherits structure but used in scoring context
    }
  
    export interface Question extends Editor.Question {
      maxScore: number;
      weight: number;
      score: number;
      validation?: ValidationRule;
      subQuestions?: SubQuestion[];
      monthlyData?: MonthlyData[];
    }
  
    export interface Category extends Editor.Category {
      maxScore: number;
      questions: Question[];
      score: number;
    }
  
    export interface Subsection extends Editor.Subsection {
      maxScore: number;
      questions?: Question[];
      categories?: Category[];
      score: number;
    }
  
    export interface Section extends Editor.Section {
      maxScore: number;
      weight: number;
      score: number;
      subsections?: Subsection[];
      questions?: Question[];
    }
  
    export interface ChecklistItem extends Editor.ChecklistTemplate {
      maxScore: number;
      sections: Section[];
      score: number | "NA";
    }
  
    export type Checklist = ChecklistItem[];
  }
  