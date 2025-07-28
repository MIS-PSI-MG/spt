import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Editor } from '../interfaces/checklist.editor.interface';

// First define the type for a section group
type SectionGroup = ReturnType<ChecklistFormService['createSectionGroup']>;

type ChecklistForm = FormGroup<{
  id: FormControl<string | null>;
  departement: FormControl<string>;
  niveau: FormControl<number>;
  title: FormControl<string>;
  metadata: FormGroup<{
    version: FormControl<string>;
    lastUpdated: FormControl<string>;
    category: FormControl<string>;
    author?: FormControl<string | null>;
    description?: FormControl<string | null>;
  }>;
  sections: FormArray<SectionGroup>;
}>;

@Injectable({
  providedIn: 'root'
})
export class ChecklistFormService {
  constructor(private fb: FormBuilder) {}

  createChecklistForm(checklist?: Editor.ChecklistTemplate): ChecklistForm {
    return this.fb.group({
      id: [checklist!.id || this.generateId() as string || null, [Validators.required]],
      departement: [checklist?.departement || '', [Validators.required]],
      niveau: [checklist?.niveau || 1, [Validators.required, Validators.min(1)]],
      title: [checklist?.title || '', [Validators.required]],
      metadata: this.fb.group({
        version: [checklist?.metadata.version || '1.0.0', [Validators.required]],
        lastUpdated: [checklist?.metadata.lastUpdated || new Date().toISOString()],
        category: [checklist?.metadata.category || '', [Validators.required]],
        author: [checklist?.metadata.author || null],
        description: [checklist?.metadata.description || null]
      }),
      sections: this.fb.array(
        checklist?.sections?.map(section => this.createSectionGroup(section)) || []
      )
    });
  }

  createSectionGroup(section?: Editor.Section) {
    return this.fb.group({
      id: [section?.id || this.generateId(), [Validators.required]],
      title: [section?.title || '', [Validators.required]],
      subsections: this.fb.array(
        section?.subsections?.map(subsection => this.createSubsectionGroup(subsection)) || []
      ),
      questions: this.fb.array(
        section?.questions?.map(question => this.createQuestionGroup(question)) || []
      )
    });
  }

  createSubsectionGroup(subsection?: Editor.Subsection) {
    return this.fb.group({
      id: [subsection?.id || this.generateId(), [Validators.required]],
      title: [subsection?.title || '', [Validators.required]],
      instruction: [subsection?.instruction || null],
      questions: this.fb.array(
        subsection?.questions?.map(q => this.createQuestionGroup(q)) || []
      ),
      categories: this.fb.array(
        subsection?.categories?.map(category => this.createCategoryGroup(category)) || []
      )
    });
  }

  createCategoryGroup(category?: Editor.Category) {
    return this.fb.group({
      id: [category?.id || this.generateId(), [Validators.required]],
      name: [category?.name || '', [Validators.required]],
      questions: this.fb.array(
        category?.questions?.map(q => this.createQuestionGroup(q)) || []
      )
    });
  }

  createQuestionGroup(question?: Editor.Question) {
    return this.fb.group({
      id: [question?.id || this.generateId(), [Validators.required]],
      text: [question?.text || '', [Validators.required]],
      type: [question?.type || 'text', [Validators.required]],
      required: [question?.required || false],
      instruction: [question?.instruction || null],
      validation: question?.validation ? this.createValidationGroup(question.validation) : null,
      subQuestions: this.fb.array(
        question?.subQuestions?.map(sq => this.createSubQuestionGroup(sq)) || []
      ),
      monthlyData: this.fb.array(
        question?.monthlyData?.map(md => this.createMonthlyDataGroup(md)) || []
      )
    });
  }

  createSubQuestionGroup(subQuestion?: Editor.SubQuestion) {
    return this.fb.group({
      id: [subQuestion?.id || this.generateId(), [Validators.required]],
      text: [subQuestion?.text || '', [Validators.required]],
      type: [subQuestion?.type || 'text', [Validators.required]]
    });
  }

  createMonthlyDataGroup(monthlyData?: Editor.MonthlyDataTemplate) {
    return this.fb.group({
      id: [monthlyData?.id || this.generateId(), [Validators.required]],
      month: [monthlyData?.month || '', [Validators.required]],
      parentId: [monthlyData?.parentId || '', [Validators.required]]
    });
  }

  createValidationGroup(validation?: Editor.ValidationRule) {
    if (!validation) return null;

    const group = this.fb.group({
      type: [validation.type, [Validators.required]],
      minValue: [validation.minValue || null],
      maxValue: [validation.maxValue || null],
      months: [validation.months || null],
      elements: this.fb.array(
        validation.elements?.map(e => this.createValidationElementGroup(e)) || []
      )
    });

    return group;
  }

  createValidationElementGroup(element?: Editor.ValidationElement) {
    return this.fb.group({
      id: [element?.id || this.generateId(), [Validators.required]],
      name: [element?.name || '', [Validators.required]],
      type: [element?.type || 'text', [Validators.required]],
      formula: [element?.formula || null],
      required: [element?.required || false]
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}
