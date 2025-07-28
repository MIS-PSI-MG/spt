/**
 * QuizModel.js
 * Interface model for quiz functionality - loads content from backoffice and handles score computation
 * This model is used for presenting assessments to users and calculating their scores
 */

export class QuizModel {
  constructor(backofficeContent) {
    this.content = this.sanitizeContent(backofficeContent);
    this.responses = new Map();
    this.startTime = null;
    this.endTime = null;
    this.currentQuestionIndex = 0;
    this.isCompleted = false;
  }

  // Content Loading and Sanitization
  sanitizeContent(content) {
    // Remove backoffice-specific metadata and keep only quiz-relevant data
    return {
      id: content.id,
      title: content.title,
      departement: content.departement,
      niveau: content.niveau,
      description: content.description,
      maxScore: this.calculateMaxScore(content),
      estimatedDuration: this.estimateCompletionTime(content),
      totalQuestions: this.countTotalQuestions(content),
      sections: this.sanitizeSections(content.sections || []),
    };
  }

  sanitizeSections(sections) {
    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      maxScore: section.maxScore || this.calculateSectionMaxScore(section),
      weight: section.weight || 1.0,
      questions: this.extractSectionQuestions(section),
      subsections: section.subsections
        ? this.sanitizeSections(section.subsections)
        : [],
      categories: section.categories
        ? this.sanitizeSections(section.categories)
        : [],
      instruction: section.instruction,
    }));
  }

  extractSectionQuestions(section) {
    if (!section.questions) return [];

    return section.questions.map((question) => ({
      id: question.id,
      text: question.text,
      type: question.type,
      maxScore: question.maxScore || 1,
      weight: question.weight || 1.0,
      required: question.required || false,
      helpText: question.helpText,
      options: question.options || [],
      subQuestions: question.subQuestions
        ? question.subQuestions.map((sq) => ({
            id: sq.id,
            text: sq.text,
            type: sq.type || "boolean",
            maxScore: sq.maxScore || 1,
            weight: sq.weight || 1.0,
          }))
        : [],
      monthlyData: question.monthlyData
        ? question.monthlyData.map((md) => ({
            id: md.id,
            month: md.month,
            parentId: md.parentId,
            elements: md.elements || [],
          }))
        : [],
      instruction: question.instruction,
    }));
  }

  // Quiz Session Management
  startQuiz() {
    this.startTime = new Date();
    this.currentQuestionIndex = 0;
    this.isCompleted = false;
    this.responses.clear();

    return {
      quizId: this.content.id,
      startTime: this.startTime,
      totalQuestions: this.content.totalQuestions,
      maxScore: this.content.maxScore,
      estimatedDuration: this.content.estimatedDuration,
    };
  }

  submitResponse(questionId, response, timestamp = new Date()) {
    if (this.isCompleted) {
      throw new Error("Quiz has already been completed");
    }

    // Validate response format
    const question = this.getQuestionById(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    const validatedResponse = this.validateResponse(question, response);

    this.responses.set(questionId, {
      value: validatedResponse,
      timestamp: timestamp,
      questionType: question.type,
    });

    return {
      questionId,
      accepted: true,
      currentScore: this.calculateCurrentScore(),
      progress: this.getProgress(),
    };
  }

  validateResponse(question, response) {
    switch (question.type) {
      case "boolean":
        if (typeof response !== "boolean") {
          throw new Error(
            `Invalid response type for boolean question ${question.id}`,
          );
        }
        return response;

      case "composite":
        if (typeof response !== "object" || response === null) {
          throw new Error(
            `Invalid response type for composite question ${question.id}`,
          );
        }

        // Validate each sub-question response
        const validatedSubResponses = {};
        question.subQuestions.forEach((subQ) => {
          if (response.hasOwnProperty(subQ.id)) {
            validatedSubResponses[subQ.id] = this.validateResponse(
              subQ,
              response[subQ.id],
            );
          }
        });
        return validatedSubResponses;

      case "choice":
        if (!question.options.includes(response)) {
          throw new Error(`Invalid choice for question ${question.id}`);
        }
        return response;

      case "text":
        return String(response).trim();

      case "number":
        const num = Number(response);
        if (isNaN(num)) {
          throw new Error(`Invalid number for question ${question.id}`);
        }
        return num;

      case "rating":
        const rating = Number(response);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          throw new Error(
            `Invalid rating for question ${question.id} (must be 1-5)`,
          );
        }
        return rating;

      case "data_validation_matrix":
        if (typeof response !== "object" || response === null) {
          throw new Error(
            `Object response required for matrix question ${question.id}`,
          );
        }
        return response;

      default:
        return response;
    }
  }

  completeQuiz() {
    if (this.isCompleted) {
      throw new Error("Quiz has already been completed");
    }

    this.endTime = new Date();
    this.isCompleted = true;

    // Validate required questions
    const validation = this.validateCompleteness();
    if (!validation.isComplete) {
      throw new Error(
        `Missing required responses: ${validation.missing.join(", ")}`,
      );
    }

    const results = this.getFinalResults();
    return results;
  }

  // Score Calculation
  calculateCurrentScore() {
    const responses = Object.fromEntries(
      Array.from(this.responses.entries()).map(([key, value]) => [
        key,
        value.value,
      ]),
    );
    return this.calculateTotalScore(responses);
  }

  calculateQuestionScore(question, response) {
    if (response === undefined || response === null) {
      return 0;
    }

    switch (question.type) {
      case "boolean":
        return response === true ? question.maxScore * question.weight : 0;

      case "composite":
        return question.subQuestions.reduce((total, subQ) => {
          const subResponse = response[subQ.id];
          if (subResponse === true) {
            return total + subQ.maxScore * subQ.weight;
          }
          return total;
        }, 0);

      case "choice":
        // Assuming correct answer is stored in question.correctAnswer
        return response === question.correctAnswer
          ? question.maxScore * question.weight
          : 0;

      case "rating":
        // For rating questions, score proportionally
        return (response / 5) * question.maxScore * question.weight;

      case "data_validation_matrix":
        return this.calculateMatrixScore(question, response);

      case "text":
      case "number":
        // These would need custom scoring logic based on requirements
        return question.maxScore * question.weight; // Assume full score for now

      default:
        return 0;
    }
  }

  calculateSectionScore(section, responses) {
    let totalScore = 0;

    // Direct questions
    if (section.questions) {
      totalScore += section.questions.reduce((sum, question) => {
        const response = responses[question.id];
        return sum + this.calculateQuestionScore(question, response);
      }, 0);
    }

    // Nested subsections
    if (section.subsections) {
      totalScore += section.subsections.reduce((sum, subsection) => {
        return sum + this.calculateSectionScore(subsection, responses);
      }, 0);
    }

    // Categories
    if (section.categories) {
      totalScore += section.categories.reduce((sum, category) => {
        return sum + this.calculateSectionScore(category, responses);
      }, 0);
    }

    return Math.min(totalScore, section.maxScore || Infinity);
  }

  // Calculate score for M&E data validation matrix
  calculateMatrixScore(question, responses) {
    if (!question.monthlyData || !Array.isArray(question.monthlyData)) {
      return 0;
    }

    let totalScore = 0;
    const scorePerMonth = question.maxScore / question.monthlyData.length;

    question.monthlyData.forEach((monthData) => {
      const monthResponse = responses[monthData.id];
      if (monthResponse && monthResponse.concordance === true) {
        totalScore += scorePerMonth;
      }
    });

    return totalScore * question.weight;
  }

  calculateTotalScore(responses) {
    return this.content.sections.reduce((total, section) => {
      return total + this.calculateSectionScore(section, responses);
    }, 0);
  }

  // Navigation and Progress
  getProgress() {
    const totalQuestions = this.content.totalQuestions;
    const answeredQuestions = this.responses.size;

    return {
      answered: answeredQuestions,
      total: totalQuestions,
      percentage: Math.round((answeredQuestions / totalQuestions) * 100),
      isComplete: answeredQuestions === totalQuestions,
    };
  }

  getCurrentQuestion() {
    const allQuestions = this.getAllQuestions();
    return allQuestions[this.currentQuestionIndex] || null;
  }

  getNextQuestion() {
    const allQuestions = this.getAllQuestions();
    if (this.currentQuestionIndex < allQuestions.length - 1) {
      this.currentQuestionIndex++;
      return allQuestions[this.currentQuestionIndex];
    }
    return null;
  }

  getPreviousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      const allQuestions = this.getAllQuestions();
      return allQuestions[this.currentQuestionIndex];
    }
    return null;
  }

  goToQuestion(questionId) {
    const allQuestions = this.getAllQuestions();
    const index = allQuestions.findIndex((q) => q.id === questionId);
    if (index !== -1) {
      this.currentQuestionIndex = index;
      return allQuestions[index];
    }
    throw new Error(`Question ${questionId} not found`);
  }

  // Question Management
  getAllQuestions() {
    const questions = [];

    const extractFromSection = (section, path = []) => {
      const currentPath = [...path, section.id];

      if (section.questions) {
        section.questions.forEach((question) => {
          questions.push({
            ...question,
            sectionPath: currentPath,
            sectionTitle: section.title,
          });

          // Add sub-questions as separate items
          if (question.type === "composite" && question.subQuestions) {
            question.subQuestions.forEach((subQ) => {
              questions.push({
                ...subQ,
                parentId: question.id,
                sectionPath: [...currentPath, question.id],
                sectionTitle: section.title,
                isSubQuestion: true,
              });
            });
          }

          // Add M&E matrix monthly data as separate items
          if (
            question.type === "data_validation_matrix" &&
            question.monthlyData
          ) {
            question.monthlyData.forEach((monthData) => {
              questions.push({
                ...monthData,
                parentId: question.id,
                sectionPath: [...currentPath, question.id],
                sectionTitle: section.title,
                isMatrixData: true,
                validation: question.validation,
              });
            });
          }
        });
      }

      // Process nested structures
      ["subsections", "categories"].forEach((key) => {
        if (section[key]) {
          section[key].forEach((item) => {
            extractFromSection(item, currentPath);
          });
        }
      });
    };

    this.content.sections.forEach((section) => {
      extractFromSection(section);
    });

    return questions;
  }

  getQuestionById(questionId) {
    const allQuestions = this.getAllQuestions();
    return allQuestions.find((q) => q.id === questionId);
  }

  getQuestionsBySection(sectionId) {
    const allQuestions = this.getAllQuestions();
    return allQuestions.filter((q) => q.sectionPath.includes(sectionId));
  }

  // Validation and Completion
  validateCompleteness() {
    const allQuestions = this.getAllQuestions();
    const requiredQuestions = allQuestions.filter((q) => q.required);
    const missing = requiredQuestions
      .filter((q) => !this.responses.has(q.id))
      .map((q) => q.id);

    return {
      isComplete: missing.length === 0,
      missing: missing,
      totalRequired: requiredQuestions.length,
      completedRequired: requiredQuestions.length - missing.length,
    };
  }

  // Results and Analytics
  getFinalResults() {
    if (!this.isCompleted) {
      throw new Error("Quiz must be completed before getting final results");
    }

    const responses = Object.fromEntries(
      Array.from(this.responses.entries()).map(([key, value]) => [
        key,
        value.value,
      ]),
    );

    const totalScore = this.calculateTotalScore(responses);
    const percentage =
      Math.round((totalScore / this.content.maxScore) * 100 * 100) / 100;
    const duration = this.endTime - this.startTime;

    const sectionResults = this.content.sections.map((section) => {
      const sectionScore = this.calculateSectionScore(section, responses);
      return {
        id: section.id,
        title: section.title,
        score: sectionScore,
        maxScore: section.maxScore,
        percentage:
          Math.round((sectionScore / section.maxScore) * 100 * 100) / 100,
      };
    });

    return {
      quizId: this.content.id,
      quizTitle: this.content.title,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: duration,
      totalScore: totalScore,
      maxScore: this.content.maxScore,
      percentage: percentage,
      grade: this.calculateGrade(percentage),
      sectionResults: sectionResults,
      questionsAnswered: this.responses.size,
      totalQuestions: this.content.totalQuestions,
      completionRate: Math.round(
        (this.responses.size / this.content.totalQuestions) * 100,
      ),
    };
  }

  calculateGrade(percentage) {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }

  getDetailedAnalysis() {
    if (!this.isCompleted) {
      throw new Error("Quiz must be completed before getting analysis");
    }

    const responses = Object.fromEntries(
      Array.from(this.responses.entries()).map(([key, value]) => [
        key,
        value.value,
      ]),
    );

    const questionAnalysis = this.getAllQuestions().map((question) => {
      const response = responses[question.id];
      const score =
        response !== undefined
          ? this.calculateQuestionScore(question, response)
          : 0;

      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        required: question.required,
        answered: response !== undefined,
        response: response,
        score: score,
        maxScore: question.maxScore,
        sectionTitle: question.sectionTitle,
      };
    });

    return {
      ...this.getFinalResults(),
      questionAnalysis: questionAnalysis,
      timePerQuestion: this.calculateTimePerQuestion(),
      strengths: this.identifyStrengths(questionAnalysis),
      weaknesses: this.identifyWeaknesses(questionAnalysis),
    };
  }

  calculateTimePerQuestion() {
    if (!this.isCompleted) return null;

    const totalTime = this.endTime - this.startTime;
    const averageTime = totalTime / this.content.totalQuestions;

    return {
      total: totalTime,
      average: averageTime,
      perQuestion: Math.round(averageTime / 1000), // in seconds
    };
  }

  identifyStrengths(questionAnalysis) {
    return questionAnalysis
      .filter((q) => q.answered && q.score === q.maxScore)
      .map((q) => ({
        section: q.sectionTitle,
        question: q.questionText,
        score: q.score,
      }));
  }

  identifyWeaknesses(questionAnalysis) {
    return questionAnalysis
      .filter((q) => !q.answered || q.score < q.maxScore)
      .map((q) => ({
        section: q.sectionTitle,
        question: q.questionText,
        score: q.score || 0,
        maxScore: q.maxScore,
        reason: !q.answered ? "Not answered" : "Incorrect answer",
      }));
  }

  // Utility Methods
  calculateMaxScore(content) {
    return content.sections.reduce((total, section) => {
      return total + this.calculateSectionMaxScore(section);
    }, 0);
  }

  calculateSectionMaxScore(section) {
    let maxScore = 0;

    if (section.questions) {
      maxScore += section.questions.reduce((sum, question) => {
        let questionScore = question.maxScore || 1;
        if (question.type === "composite" && question.subQuestions) {
          questionScore = question.subQuestions.reduce((subSum, subQ) => {
            return subSum + (subQ.maxScore || 1);
          }, 0);
        } else if (
          question.type === "data_validation_matrix" &&
          question.monthlyData
        ) {
          // For matrix questions, score is distributed across monthly data
          questionScore = question.maxScore || question.monthlyData.length;
        }
        return sum + questionScore;
      }, 0);
    }

    if (section.subsections) {
      maxScore += section.subsections.reduce((sum, subsection) => {
        return sum + this.calculateSectionMaxScore(subsection);
      }, 0);
    }

    if (section.categories) {
      maxScore += section.categories.reduce((sum, category) => {
        return sum + this.calculateSectionMaxScore(category);
      }, 0);
    }

    return maxScore;
  }

  countTotalQuestions(content) {
    let count = 0;

    const countInSection = (section) => {
      if (section.questions) {
        count += section.questions.length;
        // Count sub-questions in composite questions and matrix data
        section.questions.forEach((question) => {
          if (question.type === "composite" && question.subQuestions) {
            count += question.subQuestions.length;
          } else if (
            question.type === "data_validation_matrix" &&
            question.monthlyData
          ) {
            count += question.monthlyData.length;
          }
        });
      }

      if (section.subsections) {
        section.subsections.forEach(countInSection);
      }

      if (section.categories) {
        section.categories.forEach(countInSection);
      }
    };

    content.sections.forEach(countInSection);
    return count;
  }

  estimateCompletionTime(content) {
    const totalQuestions = this.countTotalQuestions(content);
    // Estimate 30 seconds per question on average
    return totalQuestions * 30 * 1000; // in milliseconds
  }

  // Export functionality
  exportResults(format = "json") {
    if (!this.isCompleted) {
      throw new Error("Quiz must be completed before exporting results");
    }

    const results = this.getDetailedAnalysis();

    switch (format) {
      case "json":
        return JSON.stringify(results, null, 2);
      case "csv":
        return this.convertResultsToCSV(results);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  convertResultsToCSV(results) {
    const headers = [
      "Question ID",
      "Section",
      "Question Text",
      "Type",
      "Answer",
      "Score",
      "Max Score",
      "Correct",
    ];
    const rows = [headers];

    results.questionAnalysis.forEach((q) => {
      rows.push([
        q.questionId,
        q.sectionTitle,
        q.questionText,
        q.questionType,
        String(q.response || "Not answered"),
        q.score,
        q.maxScore,
        q.score === q.maxScore ? "Yes" : "No",
      ]);
    });

    return rows
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }
}

export default QuizModel;
