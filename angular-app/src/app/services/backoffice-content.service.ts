import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject, of, throwError } from "rxjs";
import { map, catchError, tap, switchMap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
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
  MatrixElement,
} from "../interfaces/assessment.interface";
import {
  ValidationResult,
  ValidationIssue,
} from "../interfaces/scoring.interface";
import {
  IBackofficeContentService,
  AssessmentStatistics,
  ContentSearchFilters,
  SearchResult,
} from "../interfaces/services.interface";

@Injectable({
  providedIn: "root",
})
export class BackofficeContentService implements IBackofficeContentService {
  private assessments = new Map<string, Assessment>();
  private templates = new Map<string, AssessmentTemplate>();
  private assessmentsSubject = new BehaviorSubject<Assessment[]>([]);
  public assessments$ = this.assessmentsSubject.asObservable();

  constructor() {
    this.initializeDefaultData();
  }

  // Assessment Management
  createAssessment(
    assessmentData: Partial<Assessment>,
  ): Observable<Assessment> {
    const assessment: Assessment = {
      id: assessmentData.id || this.generateId(),
      departement: assessmentData.departement || "DPAL",
      niveau: assessmentData.niveau || 1,
      title: assessmentData.title || "New Assessment",
      description: assessmentData.description || "",
      maxScore: assessmentData.maxScore || 0,
      status: "draft",
      metadata: {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: assessmentData.metadata?.createdBy || "system",
        category: assessmentData.metadata?.category || "general",
        tags: assessmentData.metadata?.tags || [],
      },
      sections: assessmentData.sections || [],
    };

    this.assessments.set(assessment.id, assessment);
    this.updateAssessmentsSubject();
    return of(assessment);
  }

  updateAssessment(
    assessmentId: string,
    updates: Partial<Assessment>,
  ): Observable<Assessment> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const updatedAssessment: Assessment = {
      ...assessment,
      ...updates,
      metadata: {
        ...assessment.metadata,
        ...updates.metadata,
        lastUpdated: new Date().toISOString(),
        version: this.incrementVersion(assessment.metadata.version),
      },
    };

    this.assessments.set(assessmentId, updatedAssessment);
    this.updateAssessmentsSubject();
    return of(updatedAssessment);
  }

  getAssessment(assessmentId: string): Observable<Assessment> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }
    return of(assessment);
  }

  getAllAssessments(filters?: AssessmentFilter): Observable<Assessment[]> {
    let assessments = Array.from(this.assessments.values());

    if (filters) {
      if (filters.status) {
        assessments = assessments.filter((a) => a.status === filters.status);
      }
      if (filters.departement) {
        assessments = assessments.filter(
          (a) => a.departement === filters.departement,
        );
      }
      if (filters.category) {
        assessments = assessments.filter(
          (a) => a.metadata.category === filters.category,
        );
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        assessments = assessments.filter(
          (a) =>
            a.title.toLowerCase().includes(term) ||
            a.description?.toLowerCase().includes(term),
        );
      }
    }

    return of(assessments);
  }

  deleteAssessment(assessmentId: string): Observable<boolean> {
    const deleted = this.assessments.delete(assessmentId);
    if (deleted) {
      this.updateAssessmentsSubject();
    }
    return of(deleted);
  }

  publishAssessment(assessmentId: string): Observable<Assessment> {
    return this.updateAssessment(assessmentId, { status: "published" });
  }

  archiveAssessment(assessmentId: string): Observable<Assessment> {
    return this.updateAssessment(assessmentId, { status: "archived" });
  }

  // Section Management
  addSection(
    assessmentId: string,
    sectionData: Partial<Section>,
  ): Observable<Section> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const section: Section = {
      id: sectionData.id || this.generateId("section"),
      title: sectionData.title || "New Section",
      description: sectionData.description || "",
      maxScore: sectionData.maxScore || 0,
      weight: sectionData.weight || 1.0,
      order: sectionData.order || assessment.sections.length + 1,
      questions: sectionData.questions || [],
      subsections: sectionData.subsections || [],
      categories: sectionData.categories || [],
      instruction: sectionData.instruction || "",
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    assessment.sections.push(section);
    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => section));
  }

  updateSection(
    assessmentId: string,
    sectionId: string,
    updates: Partial<Section>,
  ): Observable<Section> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const sectionIndex = assessment.sections.findIndex(
      (s) => s.id === sectionId,
    );
    if (sectionIndex === -1) {
      return throwError(() => new Error(`Section ${sectionId} not found`));
    }

    assessment.sections[sectionIndex] = {
      ...assessment.sections[sectionIndex],
      ...updates,
      metadata: {
        ...assessment.sections[sectionIndex].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => assessment.sections[sectionIndex]));
  }

  deleteSection(assessmentId: string, sectionId: string): Observable<boolean> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const initialLength = assessment.sections.length;
    assessment.sections = assessment.sections.filter((s) => s.id !== sectionId);

    if (assessment.sections.length < initialLength) {
      this.updateAssessment(assessmentId, {
        sections: assessment.sections,
      }).subscribe();
      return of(true);
    }
    return of(false);
  }

  reorderSections(
    assessmentId: string,
    sectionIds: string[],
  ): Observable<Section[]> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const reorderedSections = sectionIds
      .map((id) => assessment.sections.find((s) => s.id === id))
      .filter(Boolean) as Section[];

    return this.updateAssessment(assessmentId, {
      sections: reorderedSections,
    }).pipe(map(() => reorderedSections));
  }

  // Subsection Management
  addSubsection(
    assessmentId: string,
    sectionId: string,
    subsectionData: Partial<Subsection>,
  ): Observable<Subsection> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const section = assessment.sections.find((s) => s.id === sectionId);
    if (!section) {
      return throwError(() => new Error(`Section ${sectionId} not found`));
    }

    const subsection: Subsection = {
      id: subsectionData.id || this.generateId("subsection"),
      title: subsectionData.title || "New Subsection",
      maxScore: subsectionData.maxScore || 0,
      weight: subsectionData.weight || 1.0,
      questions: subsectionData.questions || [],
      categories: subsectionData.categories || [],
      instruction: subsectionData.instruction || "",
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    if (!section.subsections) {
      section.subsections = [];
    }
    section.subsections.push(subsection);

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => subsection));
  }

  updateSubsection(
    assessmentId: string,
    subsectionId: string,
    updates: Partial<Subsection>,
  ): Observable<Subsection> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const subsectionLocation = this.findSubsectionLocation(
      assessment,
      subsectionId,
    );
    if (!subsectionLocation) {
      return throwError(
        () => new Error(`Subsection ${subsectionId} not found`),
      );
    }

    const { section, index } = subsectionLocation;
    section.subsections![index] = {
      ...section.subsections![index],
      ...updates,
      metadata: {
        ...section.subsections![index].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => section.subsections![index]));
  }

  deleteSubsection(
    assessmentId: string,
    subsectionId: string,
  ): Observable<boolean> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const subsectionLocation = this.findSubsectionLocation(
      assessment,
      subsectionId,
    );
    if (!subsectionLocation) {
      return of(false);
    }

    const { section, index } = subsectionLocation;
    section.subsections!.splice(index, 1);

    this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).subscribe();
    return of(true);
  }

  // Category Management
  addCategory(
    assessmentId: string,
    parentId: string,
    categoryData: Partial<Category>,
  ): Observable<Category> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const parent = this.findContainer(assessment, parentId);
    if (!parent) {
      return throwError(
        () => new Error(`Parent container ${parentId} not found`),
      );
    }

    const category: Category = {
      id: categoryData.id || this.generateId("category"),
      name: categoryData.name || "New Category",
      maxScore: categoryData.maxScore || 0,
      weight: categoryData.weight || 1.0,
      questions: categoryData.questions || [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    if (!parent.categories) {
      parent.categories = [];
    }
    parent.categories.push(category);

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => category));
  }

  updateCategory(
    assessmentId: string,
    categoryId: string,
    updates: Partial<Category>,
  ): Observable<Category> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const categoryLocation = this.findCategoryLocation(assessment, categoryId);
    if (!categoryLocation) {
      return throwError(() => new Error(`Category ${categoryId} not found`));
    }

    const { container, index } = categoryLocation;
    container.categories![index] = {
      ...container.categories![index],
      ...updates,
      metadata: {
        ...container.categories![index].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => container.categories![index]));
  }

  deleteCategory(
    assessmentId: string,
    categoryId: string,
  ): Observable<boolean> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const categoryLocation = this.findCategoryLocation(assessment, categoryId);
    if (!categoryLocation) {
      return of(false);
    }

    const { container, index } = categoryLocation;
    container.categories!.splice(index, 1);

    this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).subscribe();
    return of(true);
  }

  // Question Management
  addQuestion(
    assessmentId: string,
    containerId: string,
    questionData: Partial<Question>,
    containerType = "section",
  ): Observable<Question> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const container = this.findContainer(assessment, containerId);
    if (!container) {
      return throwError(() => new Error(`Container ${containerId} not found`));
    }

    const question: Question = {
      id: questionData.id || this.generateId("q"),
      text: questionData.text || "New Question",
      type: questionData.type || "boolean",
      maxScore: questionData.maxScore || 1,
      score: questionData.score || 1,
    
      weight: questionData.weight || 1.0,
      required: questionData.required || false,
      helpText: questionData.helpText || "",
      validation: questionData.validation || {},
      options: questionData.options || [],
      subQuestions: questionData.subQuestions || [],
      monthlyData: questionData.monthlyData || [],
      instruction: questionData.instruction || "",
      order: questionData.order || 1,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    if (!container.questions) {
      container.questions = [];
    }
    container.questions.push(question);

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => question));
  }

  updateQuestion(
    assessmentId: string,
    questionId: string,
    updates: Partial<Question>,
  ): Observable<Question> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const questionLocation = this.findQuestionLocation(assessment, questionId);
    if (!questionLocation) {
      return throwError(() => new Error(`Question ${questionId} not found`));
    }

    const { container, index } = questionLocation;
    container.questions![index] = {
      ...container.questions![index],
      ...updates,
      metadata: {
        ...container.questions![index].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => container.questions![index]));
  }

  deleteQuestion(
    assessmentId: string,
    questionId: string,
  ): Observable<boolean> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const questionLocation = this.findQuestionLocation(assessment, questionId);
    if (!questionLocation) {
      return of(false);
    }

    const { container, index } = questionLocation;
    container.questions!.splice(index, 1);

    this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).subscribe();
    return of(true);
  }

  reorderQuestions(
    assessmentId: string,
    containerId: string,
    questionIds: string[],
  ): Observable<Question[]> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const container = this.findContainer(assessment, containerId);
    if (!container || !container.questions) {
      return throwError(
        () =>
          new Error(`Container ${containerId} not found or has no questions`),
      );
    }

    const reorderedQuestions = questionIds
      .map((id) => container.questions!.find((q) => q.id === id))
      .filter(Boolean) as Question[];

    container.questions = reorderedQuestions;

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => reorderedQuestions));
  }

  // Sub-question Management
  addSubQuestion(
    assessmentId: string,
    parentQuestionId: string,
    subQuestionData: Partial<SubQuestion>,
  ): Observable<SubQuestion> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const questionLocation = this.findQuestionLocation(
      assessment,
      parentQuestionId,
    );
    if (!questionLocation) {
      return throwError(
        () => new Error(`Parent question ${parentQuestionId} not found`),
      );
    }

    const parentQuestion =
      questionLocation.container.questions![questionLocation.index];
    if (parentQuestion.type !== "composite") {
      return throwError(
        () => new Error("Parent question must be of type composite"),
      );
    }

    const subQuestion: SubQuestion = {
      id: subQuestionData.id || this.generateId("sq"),
      text: subQuestionData.text || "New Sub-question",
      type: subQuestionData.type || "boolean",
      maxScore: subQuestionData.maxScore || 1,
      weight: subQuestionData.weight || 1.0,
      validation: subQuestionData.validation || {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    if (!parentQuestion.subQuestions) {
      parentQuestion.subQuestions = [];
    }
    parentQuestion.subQuestions.push(subQuestion);

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => subQuestion));
  }

  updateSubQuestion(
    assessmentId: string,
    subQuestionId: string,
    updates: Partial<SubQuestion>,
  ): Observable<SubQuestion> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const subQuestionLocation = this.findSubQuestionLocation(
      assessment,
      subQuestionId,
    );
    if (!subQuestionLocation) {
      return throwError(
        () => new Error(`Sub-question ${subQuestionId} not found`),
      );
    }

    const { parentQuestion, index } = subQuestionLocation;
    parentQuestion.subQuestions![index] = {
      ...parentQuestion.subQuestions![index],
      ...updates,
      metadata: {
        ...parentQuestion.subQuestions![index].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => parentQuestion.subQuestions![index]));
  }

  deleteSubQuestion(
    assessmentId: string,
    subQuestionId: string,
  ): Observable<boolean> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const subQuestionLocation = this.findSubQuestionLocation(
      assessment,
      subQuestionId,
    );
    if (!subQuestionLocation) {
      return of(false);
    }

    const { parentQuestion, index } = subQuestionLocation;
    parentQuestion.subQuestions!.splice(index, 1);

    this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).subscribe();
    return of(true);
  }

  // M&E Matrix Management
  createMatrixQuestion(
    assessmentId: string,
    containerId: string,
    matrixQuestionData: Partial<Question>,
  ): Observable<Question> {
    const baseQuestion: Partial<Question> = {
      ...matrixQuestionData,
      type: "data_validation_matrix",
      validation: {
        type: "matrix_validation",
        months: 3,
        elements: [
          {
            id: "rma_count",
            name: "Nombre dans l'outils de rapportage (RMA)",
            type: "number",
            required: true,
          },
          {
            id: "recount",
            name: "Nombre recompté dans les outils de collecte de données",
            type: "number",
            required: true,
          },
          {
            id: "ratio",
            name: "Taux de rapportage",
            type: "calculated_number",
            formula: "rma_count / recount",
            required: true,
          },
          {
            id: "concordance",
            name: "Y a-t-il concordance",
            type: "boolean",
            maxScore: 1,
            required: true,
          },
        ],
      },
    };

    return this.addQuestion(assessmentId, containerId, baseQuestion).pipe(
      tap((question) => {
        // Add monthly data entries
        const months = ["Mois 1", "Mois 2", "Mois 3"];
        months.forEach((month, index) => {
          this.addMatrixData(assessmentId, question.id, {
            id: `${question.id}_m${index + 1}`,
            month: month,
            parentId: question.id,
          }).subscribe();
        });
      }),
    );
  }

  addMatrixData(
    assessmentId: string,
    parentQuestionId: string,
    matrixData: Partial<MonthlyData>,
  ): Observable<MonthlyData> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const questionLocation = this.findQuestionLocation(
      assessment,
      parentQuestionId,
    );
    if (!questionLocation) {
      return throwError(
        () => new Error(`Parent question ${parentQuestionId} not found`),
      );
    }

    const parentQuestion =
      questionLocation.container.questions![questionLocation.index];
    if (parentQuestion.type !== "data_validation_matrix") {
      return throwError(
        () =>
          new Error("Parent question must be of type data_validation_matrix"),
      );
    }

    const monthData: MonthlyData = {
      id: matrixData.id || this.generateId("matrix"),
      month: matrixData.month || "Mois 1",
      parentId: parentQuestionId,
      elements: matrixData.elements || [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    if (!parentQuestion.monthlyData) {
      parentQuestion.monthlyData = [];
    }
    parentQuestion.monthlyData.push(monthData);

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => monthData));
  }

  updateMatrixData(
    assessmentId: string,
    matrixDataId: string,
    updates: Partial<MonthlyData>,
  ): Observable<MonthlyData> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const matrixLocation = this.findMatrixDataLocation(
      assessment,
      matrixDataId,
    );
    if (!matrixLocation) {
      return throwError(
        () => new Error(`Matrix data ${matrixDataId} not found`),
      );
    }

    const { parentQuestion, index } = matrixLocation;
    parentQuestion.monthlyData![index] = {
      ...parentQuestion.monthlyData![index],
      ...updates,
      metadata: {
        ...parentQuestion.monthlyData![index].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    return this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).pipe(map(() => parentQuestion.monthlyData![index]));
  }

  deleteMatrixData(
    assessmentId: string,
    matrixDataId: string,
  ): Observable<boolean> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const matrixLocation = this.findMatrixDataLocation(
      assessment,
      matrixDataId,
    );
    if (!matrixLocation) {
      return of(false);
    }

    const { parentQuestion, index } = matrixLocation;
    parentQuestion.monthlyData!.splice(index, 1);

    this.updateAssessment(assessmentId, {
      sections: assessment.sections,
    }).subscribe();
    return of(true);
  }

  // Template Management
  createTemplate(
    templateData: Partial<AssessmentTemplate>,
  ): Observable<AssessmentTemplate> {
    const template: AssessmentTemplate = {
      id: templateData.id || this.generateId("template"),
      name: templateData.name || "New Template",
      description: templateData.description || "",
      category: templateData.category || "general",
      structure: templateData.structure || {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: templateData.metadata?.createdBy || "system",
        version: "1.0",
      },
    };

    this.templates.set(template.id, template);
    return of(template);
  }

  getTemplates(category?: string): Observable<AssessmentTemplate[]> {
    let templates = Array.from(this.templates.values());
    if (category) {
      templates = templates.filter((t) => t.category === category);
    }
    return of(templates);
  }

  getTemplate(templateId: string): Observable<AssessmentTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      return throwError(() => new Error(`Template ${templateId} not found`));
    }
    return of(template);
  }

  updateTemplate(
    templateId: string,
    updates: Partial<AssessmentTemplate>,
  ): Observable<AssessmentTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      return throwError(() => new Error(`Template ${templateId} not found`));
    }

    const updatedTemplate: AssessmentTemplate = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    this.templates.set(templateId, updatedTemplate);
    return of(updatedTemplate);
  }

  deleteTemplate(templateId: string): Observable<boolean> {
    return of(this.templates.delete(templateId));
  }

  createAssessmentFromTemplate(
    templateId: string,
    assessmentData: Partial<Assessment>,
  ): Observable<Assessment> {
    const template = this.templates.get(templateId);
    if (!template) {
      return throwError(() => new Error(`Template ${templateId} not found`));
    }

    const assessment: Partial<Assessment> = {
      ...template.structure,
      ...assessmentData,
      id: assessmentData.id || this.generateId(),
      metadata: {
        ...template.structure.metadata,
        ...assessmentData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: assessmentData.metadata?.createdBy || "system",
      },
    };

    return this.createAssessment(assessment);
  }

  // Import/Export
  exportAssessment(assessmentId: string, format = "json"): Observable<string> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    switch (format) {
      case "json":
        return of(JSON.stringify(assessment, null, 2));
      case "csv":
        return of(this.convertToCSV(assessment));
      default:
        return throwError(
          () => new Error(`Unsupported export format: ${format}`),
        );
    }
  }

  importAssessment(
    data: string | File,
    format = "json",
  ): Observable<Assessment> {
    if (data instanceof File) {
      return throwError(() => new Error("File import not implemented yet"));
    }

    let assessmentData: any;
    switch (format) {
      case "json":
        try {
          assessmentData = JSON.parse(data);
        } catch (error) {
          return throwError(() => new Error("Invalid JSON format"));
        }
        break;
      default:
        return throwError(
          () => new Error(`Unsupported import format: ${format}`),
        );
    }

    return this.validateAssessmentStructure(assessmentData).pipe(
      catchError((error) => throwError(() => error)),
      map(() => assessmentData),
      switchMap((validData) => this.createAssessment(validData)),
    );
  }

  validateAssessmentStructure(data: any): Observable<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const required = ["title", "departement", "niveau"];

    required.forEach((field) => {
      if (!data[field]) {
        issues.push({
          type: "missing_required",
          questionId: "",
          path: [field],
          message: `Missing required field: ${field}`,
        });
      }
    });

    const result: ValidationResult = {
      isValid: issues.length === 0,
      issues,
      requiredQuestions: required.length,
      requiredAnswered: required.length - issues.length,
    };

    return of(result);
  }

  // Utility Methods
  duplicateAssessment(
    assessmentId: string,
    newTitle?: string,
  ): Observable<Assessment> {
    const original = this.assessments.get(assessmentId);
    if (!original) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const duplicate: Partial<Assessment> = {
      ...original,
      id: this.generateId(),
      title: newTitle || `${original.title} (Copy)`,
      status: "draft",
      metadata: {
        ...original.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0",
      },
    };

    return this.createAssessment(duplicate);
  }

  getAssessmentStatistics(
    assessmentId: string,
  ): Observable<AssessmentStatistics> {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      return throwError(
        () => new Error(`Assessment ${assessmentId} not found`),
      );
    }

    const totalQuestions = this.countQuestions(assessment);
    const questionsByType = this.getQuestionsByType(assessment);

    const stats: AssessmentStatistics = {
      totalQuestions,
      questionsByType,
      totalSections: assessment.sections.length,
      averageTimeToComplete: totalQuestions * 30, // 30 seconds per question
      completionRate: 85, // Mock data
      averageScore: 75, // Mock data
      difficulty:
        totalQuestions > 50 ? "Hard" : totalQuestions > 20 ? "Medium" : "Easy",
    };

    return of(stats);
  }

  searchContent(
    query: string,
    filters?: ContentSearchFilters,
  ): Observable<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    for (const assessment of this.assessments.values()) {
      // Search in assessment
      if (assessment.title.toLowerCase().includes(searchTerm)) {
        results.push({
          id: assessment.id,
          title: assessment.title,
          type: "assessment",
          departement: assessment.departement,
          relevanceScore: 1.0,
          highlightedText: assessment.title,
          path: [assessment.title],
        });
      }

      // Search in sections and questions
      assessment.sections.forEach((section) => {
        if (section.title.toLowerCase().includes(searchTerm)) {
          results.push({
            id: section.id,
            title: section.title,
            type: "section",
            departement: assessment.departement,
            relevanceScore: 0.8,
            highlightedText: section.title,
            path: [assessment.title, section.title],
          });
        }

        // Search in questions
        this.searchQuestionsInContainer(
          section,
          assessment,
          searchTerm,
          results,
        );
      });
    }

    return of(results.sort((a, b) => b.relevanceScore - a.relevanceScore));
  }

  // Private utility methods
  private updateAssessmentsSubject(): void {
    this.assessmentsSubject.next(Array.from(this.assessments.values()));
  }

  private generateId(prefix = "id"): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const patch = parseInt(parts[2] || "0") + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private findContainer(
    assessment: Assessment,
    containerId: string,
  ): Section | Subsection | Category | null {
    for (const section of assessment.sections) {
      if (section.id === containerId) return section;

      if (section.subsections) {
        for (const subsection of section.subsections) {
          if (subsection.id === containerId) return subsection;
        }
      }

      if (section.categories) {
        for (const category of section.categories) {
          if (category.id === containerId) return category;
        }
      }
    }
    return null;
  }

  private findQuestionLocation(
    assessment: Assessment,
    questionId: string,
  ): { container: any; index: number } | null {
    const searchInContainer = (container: any) => {
      if (container.questions) {
        const index = container.questions.findIndex(
          (q: Question) => q.id === questionId,
        );
        if (index !== -1) {
          return { container, index };
        }
      }
      return null;
    };

    for (const section of assessment.sections) {
      let result = searchInContainer(section);
      if (result) return result;

      if (section.subsections) {
        for (const subsection of section.subsections) {
          result = searchInContainer(subsection);
          if (result) return result;
        }
      }

      if (section.categories) {
        for (const category of section.categories) {
          result = searchInContainer(category);
          if (result) return result;
        }
      }
    }
    return null;
  }

  private findSubsectionLocation(
    assessment: Assessment,
    subsectionId: string,
  ): { section: Section; index: number } | null {
    for (const section of assessment.sections) {
      if (section.subsections) {
        const index = section.subsections.findIndex(
          (s) => s.id === subsectionId,
        );
        if (index !== -1) {
          return { section, index };
        }
      }
    }
    return null;
  }

  private findCategoryLocation(
    assessment: Assessment,
    categoryId: string,
  ): { container: any; index: number } | null {
    for (const section of assessment.sections) {
      if (section.categories) {
        const index = section.categories.findIndex((c) => c.id === categoryId);
        if (index !== -1) {
          return { container: section, index };
        }
      }

      if (section.subsections) {
        for (const subsection of section.subsections) {
          if (subsection.categories) {
            const index = subsection.categories.findIndex(
              (c) => c.id === categoryId,
            );
            if (index !== -1) {
              return { container: subsection, index };
            }
          }
        }
      }
    }
    return null;
  }

  private findSubQuestionLocation(
    assessment: Assessment,
    subQuestionId: string,
  ): { parentQuestion: Question; index: number } | null {
    const searchInContainer = (container: any) => {
      if (container.questions) {
        for (const question of container.questions) {
          if (question.subQuestions) {
            const index = question.subQuestions.findIndex(
              (sq: SubQuestion) => sq.id === subQuestionId,
            );
            if (index !== -1) {
              return { parentQuestion: question, index };
            }
          }
        }
      }
      return null;
    };

    for (const section of assessment.sections) {
      let result = searchInContainer(section);
      if (result) return result;

      if (section.subsections) {
        for (const subsection of section.subsections) {
          result = searchInContainer(subsection);
          if (result) return result;
        }
      }

      if (section.categories) {
        for (const category of section.categories) {
          result = searchInContainer(category);
          if (result) return result;
        }
      }
    }
    return null;
  }

  private findMatrixDataLocation(
    assessment: Assessment,
    matrixDataId: string,
  ): { parentQuestion: Question; index: number } | null {
    const searchInContainer = (container: any) => {
      if (container.questions) {
        for (const question of container.questions) {
          if (question.monthlyData) {
            const index = question.monthlyData.findIndex(
              (md: MonthlyData) => md.id === matrixDataId,
            );
            if (index !== -1) {
              return { parentQuestion: question, index };
            }
          }
        }
      }
      return null;
    };

    for (const section of assessment.sections) {
      let result = searchInContainer(section);
      if (result) return result;

      if (section.subsections) {
        for (const subsection of section.subsections) {
          result = searchInContainer(subsection);
          if (result) return result;
        }
      }

      if (section.categories) {
        for (const category of section.categories) {
          result = searchInContainer(category);
          if (result) return result;
        }
      }
    }
    return null;
  }

  private convertToCSV(assessment: Assessment): string {
    const headers = [
      "Section",
      "Subsection",
      "Question ID",
      "Question Text",
      "Type",
      "Required",
    ];
    const rows = [headers];

    const extractQuestions = (
      container: any,
      sectionTitle = "",
      subsectionTitle = "",
    ) => {
      if (container.questions) {
        container.questions.forEach((question: Question) => {
          rows.push([
            sectionTitle,
            subsectionTitle,
            question.id,
            question.text,
            question.type,
            question.required ? "Yes" : "No",
          ]);
        });
      }
    };

    assessment.sections.forEach((section) => {
      extractQuestions(section, section.title);

      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          extractQuestions(subsection, section.title, subsection.title);
        });
      }

      if (section.categories) {
        section.categories.forEach((category) => {
          extractQuestions(category, section.title, category.name);
        });
      }
    });

    return rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }

  private countQuestions(assessment: Assessment): number {
    let count = 0;

    const countInContainer = (container: any) => {
      if (container.questions) {
        count += container.questions.length;
        container.questions.forEach((question: Question) => {
          if (question.subQuestions) {
            count += question.subQuestions.length;
          }
          if (question.monthlyData) {
            count += question.monthlyData.length;
          }
        });
      }

      if (container.subsections) {
        container.subsections.forEach(countInContainer);
      }

      if (container.categories) {
        container.categories.forEach(countInContainer);
      }
    };

    assessment.sections.forEach(countInContainer);
    return count;
  }

  private getQuestionsByType(assessment: Assessment): {
    [type: string]: number;
  } {
    const typeCount: { [type: string]: number } = {};

    const countTypesInContainer = (container: any) => {
      if (container.questions) {
        container.questions.forEach((question: Question) => {
          typeCount[question.type] = (typeCount[question.type] || 0) + 1;
        });
      }

      if (container.subsections) {
        container.subsections.forEach(countTypesInContainer);
      }

      if (container.categories) {
        container.categories.forEach(countTypesInContainer);
      }
    };

    assessment.sections.forEach(countTypesInContainer);
    return typeCount;
  }

  private searchQuestionsInContainer(
    container: any,
    assessment: Assessment,
    searchTerm: string,
    results: SearchResult[],
  ): void {
    if (container.questions) {
      container.questions.forEach((question: Question) => {
        if (question.text.toLowerCase().includes(searchTerm)) {
          results.push({
            id: question.id,
            title: question.text,
            type: "question",
            departement: assessment.departement,
            relevanceScore: 0.6,
            highlightedText: question.text,
            path: [
              assessment.title,
              container.title || container.name,
              question.text,
            ],
          });
        }
      });
    }

    if (container.subsections) {
      container.subsections.forEach((subsection: Subsection) => {
        this.searchQuestionsInContainer(
          subsection,
          assessment,
          searchTerm,
          results,
        );
      });
    }

    if (container.categories) {
      container.categories.forEach((category: Category) => {
        this.searchQuestionsInContainer(
          category,
          assessment,
          searchTerm,
          results,
        );
      });
    }
  }

  private initializeDefaultData(): void {
    // Initialize with sample data from the original checkList
    const sampleAssessment: Assessment = {
      id: "01",
      departement: "DPAL",
      niveau: 6,
      title: "Site Communautaire",
      description: "Assessment for community sites",
      maxScore: 37,
      status: "published",
      metadata: {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "system",
        category: "health_assessment",
        tags: ["community", "health", "assessment"],
      },
      sections: [
        {
          id: "section_01_01",
          title: "Ressources humaines",
          description: "Human resources assessment",
          maxScore: 11,
          weight: 1.0,
          order: 1,
          subsections: [
            {
              id: "subsection_01_01_01",
              title: "Le Site communautaire dispose-t-elle d'un :",
              maxScore: 11,
              weight: 1.0,
              questions: [
                {
                  id: "rh_001",
                  text: "Agent communautaire formé aux protocoles de prise en charge du paludisme",
                  type: "boolean",
                  maxScore: 1,
                  weight: 1.0,
                  required: true,
                  helpText: "Vérifier la formation de l'agent",
                  validation: { type: "required" },
                  order: 1,
                  metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                },
              ],
              metadata: {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          ],
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    };

    this.assessments.set(sampleAssessment.id, sampleAssessment);
    this.updateAssessmentsSubject();
  }
}
