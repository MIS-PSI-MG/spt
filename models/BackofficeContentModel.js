/**
 * BackofficeContentModel.js
 * Interface model for backoffice content edition - focuses on content management without scoring logic
 * This model is used for creating, editing, and managing assessment content in the admin interface
 */

export class BackofficeContentModel {
  constructor() {
    this.assessments = new Map();
    this.templates = new Map();
    this.categories = new Map();
  }

  // Assessment Management
  createAssessment(assessmentData) {
    const assessment = {
      id: assessmentData.id || this.generateId(),
      departement: assessmentData.departement,
      niveau: assessmentData.niveau,
      title: assessmentData.title,
      description: assessmentData.description || "",
      status: "draft", // draft, published, archived
      metadata: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: assessmentData.createdBy,
        category: assessmentData.category || "general",
        tags: assessmentData.tags || [],
      },
      sections: [],
    };

    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  updateAssessment(assessmentId, updates) {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const updatedAssessment = {
      ...assessment,
      ...updates,
      metadata: {
        ...assessment.metadata,
        updatedAt: new Date().toISOString(),
        version: this.incrementVersion(assessment.metadata.version),
      },
    };

    this.assessments.set(assessmentId, updatedAssessment);
    return updatedAssessment;
  }

  getAssessment(assessmentId) {
    return this.assessments.get(assessmentId);
  }

  getAllAssessments(filters = {}) {
    let assessments = Array.from(this.assessments.values());

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

    return assessments;
  }

  deleteAssessment(assessmentId) {
    return this.assessments.delete(assessmentId);
  }

  // Section Management
  addSection(assessmentId, sectionData) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const section = {
      id: sectionData.id || this.generateId("section"),
      title: sectionData.title,
      description: sectionData.description || "",
      order: sectionData.order || assessment.sections.length + 1,
      weight: sectionData.weight || 1.0,
      subsections: [],
      questions: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    assessment.sections.push(section);
    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return section;
  }

  updateSection(assessmentId, sectionId, updates) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const sectionIndex = assessment.sections.findIndex(
      (s) => s.id === sectionId,
    );
    if (sectionIndex === -1) {
      throw new Error(`Section ${sectionId} not found`);
    }

    assessment.sections[sectionIndex] = {
      ...assessment.sections[sectionIndex],
      ...updates,
      metadata: {
        ...assessment.sections[sectionIndex].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return assessment.sections[sectionIndex];
  }

  deleteSection(assessmentId, sectionId) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    assessment.sections = assessment.sections.filter((s) => s.id !== sectionId);
    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return true;
  }

  // Question Management
  addQuestion(
    assessmentId,
    containerId,
    questionData,
    containerType = "section",
  ) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const question = {
      id: questionData.id || this.generateId("q"),
      text: questionData.text,
      type: questionData.type || "boolean", // boolean, composite, text, number, choice, data_validation_matrix
      order: questionData.order || 1,
      weight: questionData.weight || 1.0,
      required: questionData.required || false,
      helpText: questionData.helpText || "",
      validation: questionData.validation || {},
      options: questionData.options || [], // for choice type questions
      subQuestions: questionData.subQuestions || [], // for composite questions
      monthlyData: questionData.monthlyData || [], // for M&E matrix questions
      instruction: questionData.instruction || "", // for special instructions
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    // Find the container and add the question
    const container = this.findContainer(
      assessment,
      containerId,
      containerType,
    );
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    if (!container.questions) {
      container.questions = [];
    }

    container.questions.push(question);
    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return question;
  }

  updateQuestion(assessmentId, questionId, updates) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const questionLocation = this.findQuestionLocation(assessment, questionId);
    if (!questionLocation) {
      throw new Error(`Question ${questionId} not found`);
    }

    const { container, index } = questionLocation;
    container.questions[index] = {
      ...container.questions[index],
      ...updates,
      metadata: {
        ...container.questions[index].metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return container.questions[index];
  }

  deleteQuestion(assessmentId, questionId) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const questionLocation = this.findQuestionLocation(assessment, questionId);
    if (!questionLocation) {
      throw new Error(`Question ${questionId} not found`);
    }

    const { container, index } = questionLocation;
    container.questions.splice(index, 1);
    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return true;
  }

  // Composite Question Management
  addSubQuestion(assessmentId, parentQuestionId, subQuestionData) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const questionLocation = this.findQuestionLocation(
      assessment,
      parentQuestionId,
    );
    if (!questionLocation) {
      throw new Error(`Parent question ${parentQuestionId} not found`);
    }

    const parentQuestion =
      questionLocation.container.questions[questionLocation.index];
    if (parentQuestion.type !== "composite") {
      throw new Error(`Parent question must be of type 'composite'`);
    }

    const subQuestion = {
      id: subQuestionData.id || this.generateId("sq"),
      text: subQuestionData.text,
      type: subQuestionData.type || "boolean",
      weight: subQuestionData.weight || 1.0,
      maxScore: subQuestionData.maxScore || 1,
      order: subQuestionData.order || parentQuestion.subQuestions.length + 1,
      validation: subQuestionData.validation || {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    parentQuestion.subQuestions.push(subQuestion);
    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return subQuestion;
  }

  // M&E Matrix Data Management
  addMatrixData(assessmentId, parentQuestionId, matrixData) {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const questionLocation = this.findQuestionLocation(
      assessment,
      parentQuestionId,
    );
    if (!questionLocation) {
      throw new Error(`Parent question ${parentQuestionId} not found`);
    }

    const parentQuestion =
      questionLocation.container.questions[questionLocation.index];
    if (parentQuestion.type !== "data_validation_matrix") {
      throw new Error(
        `Parent question must be of type 'data_validation_matrix'`,
      );
    }

    const monthData = {
      id: matrixData.id || this.generateId("matrix"),
      month: matrixData.month,
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
    this.updateAssessment(assessmentId, { sections: assessment.sections });
    return monthData;
  }

  // Create M&E Data Validation Matrix Question
  createMatrixQuestion(assessmentId, containerId, matrixQuestionData) {
    const baseQuestion = {
      ...matrixQuestionData,
      type: "data_validation_matrix",
      validation: {
        type: "matrix_validation",
        months: matrixQuestionData.months || 3,
        elements: matrixQuestionData.elements || [
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

    const question = this.addQuestion(assessmentId, containerId, baseQuestion);

    // Add monthly data entries
    const months = ["Mois 1", "Mois 2", "Mois 3"];
    months.forEach((month, index) => {
      this.addMatrixData(assessmentId, question.id, {
        id: `${question.id}_m${index + 1}`,
        month: month,
        elements: baseQuestion.validation.elements,
      });
    });

    return question;
  }

  // Template Management
  createTemplate(templateData) {
    const template = {
      id: templateData.id || this.generateId("template"),
      name: templateData.name,
      description: templateData.description || "",
      category: templateData.category || "general",
      structure: templateData.structure, // The assessment structure without content
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: templateData.createdBy,
        version: "1.0",
      },
    };

    this.templates.set(template.id, template);
    return template;
  }

  createAssessmentFromTemplate(templateId, assessmentData) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const assessment = {
      ...template.structure,
      ...assessmentData,
      id: assessmentData.id || this.generateId(),
      metadata: {
        ...template.structure.metadata,
        ...assessmentData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        templateId: templateId,
        createdBy: assessmentData.createdBy,
      },
    };

    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  // Utility Methods
  generateId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  incrementVersion(version) {
    const parts = version.split(".");
    const patch = parseInt(parts[2] || "0") + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  findContainer(assessment, containerId, containerType) {
    for (const section of assessment.sections) {
      if (section.id === containerId && containerType === "section") {
        return section;
      }

      // Check subsections
      if (section.subsections) {
        for (const subsection of section.subsections) {
          if (subsection.id === containerId && containerType === "subsection") {
            return subsection;
          }
        }
      }

      // Check categories
      if (section.categories) {
        for (const category of section.categories) {
          if (category.id === containerId && containerType === "category") {
            return category;
          }
        }
      }
    }
    return null;
  }

  findQuestionLocation(assessment, questionId) {
    const searchInContainer = (container) => {
      if (container.questions) {
        const index = container.questions.findIndex((q) => q.id === questionId);
        if (index !== -1) {
          return { container, index };
        }
      }
      return null;
    };

    for (const section of assessment.sections) {
      // Check section questions
      let result = searchInContainer(section);
      if (result) return result;

      // Check subsection questions
      if (section.subsections) {
        for (const subsection of section.subsections) {
          result = searchInContainer(subsection);
          if (result) return result;
        }
      }

      // Check category questions
      if (section.categories) {
        for (const category of section.categories) {
          result = searchInContainer(category);
          if (result) return result;
        }
      }
    }
    return null;
  }

  // Export/Import functionality
  exportAssessment(assessmentId, format = "json") {
    const assessment = this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    switch (format) {
      case "json":
        return JSON.stringify(assessment, null, 2);
      case "csv":
        return this.convertToCSV(assessment);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  importAssessment(data, format = "json") {
    let assessmentData;

    switch (format) {
      case "json":
        assessmentData = typeof data === "string" ? JSON.parse(data) : data;
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    // Validate structure
    this.validateAssessmentStructure(assessmentData);

    const assessment = this.createAssessment(assessmentData);
    return assessment;
  }

  validateAssessmentStructure(data) {
    const required = ["title", "departement", "niveau"];
    const missing = required.filter((field) => !data[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    // Additional validation logic can be added here
    return true;
  }

  convertToCSV(assessment) {
    // Simple CSV conversion for questions
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
      container,
      sectionTitle = "",
      subsectionTitle = "",
    ) => {
      if (container.questions) {
        container.questions.forEach((question) => {
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
}

// Content validation schemas
export const ValidationSchemas = {
  assessment: {
    required: ["id", "title", "departement", "niveau"],
    optional: ["description", "metadata", "sections"],
  },

  section: {
    required: ["id", "title"],
    optional: [
      "description",
      "order",
      "weight",
      "subsections",
      "questions",
      "categories",
    ],
  },

  question: {
    required: ["id", "text", "type"],
    optional: [
      "order",
      "weight",
      "required",
      "helpText",
      "validation",
      "options",
      "subQuestions",
    ],
  },

  questionTypes: [
    "boolean",
    "composite",
    "text",
    "number",
    "choice",
    "rating",
    "date",
    "data_validation_matrix",
  ],
};

// Default templates
export const DefaultTemplates = {
  basicAssessment: {
    name: "Basic Assessment Template",
    description: "A simple assessment template with basic structure",
    structure: {
      title: "",
      departement: "",
      niveau: 1,
      sections: [
        {
          id: "section_01",
          title: "Section 1",
          questions: [],
        },
      ],
    },
  },

  healthAssessment: {
    name: "Health Assessment Template",
    description: "Template for health-related assessments",
    structure: {
      title: "",
      departement: "HEALTH",
      niveau: 1,
      sections: [
        {
          id: "section_resources",
          title: "Resources",
          questions: [],
        },
        {
          id: "section_prevention",
          title: "Prevention",
          questions: [],
        },
      ],
    },
  },

  meAssessment: {
    name: "M&E Assessment Template",
    description:
      "Template for Monitoring & Evaluation assessments with data validation matrices",
    structure: {
      title: "",
      departement: "M&E",
      niveau: 1,
      sections: [
        {
          id: "section_human_resources",
          title: "Ressources humaines",
          questions: [],
        },
        {
          id: "section_tools_availability",
          title: "Disponibilité des outils de gestion",
          questions: [],
        },
        {
          id: "section_data_accuracy",
          title: "Revue de l'exactitude des données",
          questions: [],
        },
      ],
    },
  },
};

export default BackofficeContentModel;
