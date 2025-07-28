/**
 * ScoreCalculator.js
 * Enhanced utility for calculating scores with advanced features
 * Supports weighted scoring, partial credit, time-based scoring, and analytics
 */

export class ScoreCalculator {
  constructor(options = {}) {
    this.options = {
      strictMode: options.strictMode || false,
      partialCredit: options.partialCredit !== false,
      timeBasedScoring: options.timeBasedScoring || false,
      weightedScoring: options.weightedScoring !== false,
      roundingPrecision: options.roundingPrecision || 2,
      ...options
    };
  }

  /**
   * Calculate score for a single question with enhanced logic
   */
  calculateQuestionScore(question, response, context = {}) {
    if (!question || !question.id) {
      throw new Error('Invalid question object');
    }

    // Handle missing or null responses
    if (response === undefined || response === null) {
      if (this.options.strictMode && question.required) {
        throw new Error(`Required question ${question.id} is missing response`);
      }
      return this.createScoreResult(0, question.maxScore || 1, question.id);
    }

    const baseScore = this._calculateBaseScore(question, response);
    const weightedScore = this._applyWeight(baseScore, question.weight);
    const timeAdjustedScore = this._applyTimeAdjustment(weightedScore, context.timeSpent, question);
    const finalScore = Math.min(timeAdjustedScore, question.maxScore || 1);

    return this.createScoreResult(finalScore, question.maxScore || 1, question.id, {
      baseScore,
      weightedScore,
      timeAdjustedScore,
      response,
      questionType: question.type
    });
  }

  /**
   * Calculate base score based on question type
   */
  _calculateBaseScore(question, response) {
    switch (question.type) {
      case 'boolean':
        return this._calculateBooleanScore(question, response);

      case 'composite':
        return this._calculateCompositeScore(question, response);

      case 'choice':
        return this._calculateChoiceScore(question, response);

      case 'rating':
        return this._calculateRatingScore(question, response);

      case 'text':
        return this._calculateTextScore(question, response);

      case 'number':
        return this._calculateNumberScore(question, response);

      case 'range':
        return this._calculateRangeScore(question, response);

      default:
        console.warn(`Unknown question type: ${question.type}`);
        return 0;
    }
  }

  /**
   * Boolean question scoring
   */
  _calculateBooleanScore(question, response) {
    if (typeof response !== 'boolean') {
      return 0;
    }

    const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : true;
    return response === correctAnswer ? (question.maxScore || 1) : 0;
  }

  /**
   * Composite question scoring with sub-question support
   */
  _calculateCompositeScore(question, response) {
    if (!question.subQuestions || !Array.isArray(question.subQuestions)) {
      return 0;
    }

    if (typeof response !== 'object' || response === null) {
      return 0;
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    question.subQuestions.forEach(subQuestion => {
      const subResponse = response[subQuestion.id];
      const subQuestionResult = this.calculateQuestionScore(subQuestion, subResponse);

      totalScore += subQuestionResult.score;
      maxPossibleScore += subQuestion.maxScore || 1;
    });

    // Apply partial credit if enabled
    if (this.options.partialCredit && question.partialCreditThreshold) {
      const completionRate = totalScore / maxPossibleScore;
      if (completionRate >= question.partialCreditThreshold) {
        return totalScore;
      } else {
        return totalScore * completionRate;
      }
    }

    return totalScore;
  }

  /**
   * Choice question scoring (single or multiple)
   */
  _calculateChoiceScore(question, response) {
    if (!question.correctAnswers && !question.correctAnswer) {
      // If no correct answer is defined, assume any response is valid
      return question.maxScore || 1;
    }

    // Handle single choice
    if (question.correctAnswer !== undefined) {
      return response === question.correctAnswer ? (question.maxScore || 1) : 0;
    }

    // Handle multiple choice
    if (Array.isArray(question.correctAnswers)) {
      if (!Array.isArray(response)) {
        return 0;
      }

      const correctCount = response.filter(r => question.correctAnswers.includes(r)).length;
      const incorrectCount = response.filter(r => !question.correctAnswers.includes(r)).length;

      if (this.options.partialCredit) {
        // Partial credit: correct answers add points, incorrect subtract
        const score = (correctCount / question.correctAnswers.length) * (question.maxScore || 1);
        const penalty = (incorrectCount / response.length) * (question.maxScore || 1) * 0.5; // 50% penalty
        return Math.max(0, score - penalty);
      } else {
        // All or nothing
        return (correctCount === question.correctAnswers.length && incorrectCount === 0)
          ? (question.maxScore || 1) : 0;
      }
    }

    return 0;
  }

  /**
   * Rating question scoring (1-5 scale typically)
   */
  _calculateRatingScore(question, response) {
    const rating = Number(response);
    if (isNaN(rating)) {
      return 0;
    }

    const minRating = question.minRating || 1;
    const maxRating = question.maxRating || 5;

    if (rating < minRating || rating > maxRating) {
      return 0;
    }

    // If there's an expected rating, calculate based on proximity
    if (question.expectedRating !== undefined) {
      const difference = Math.abs(rating - question.expectedRating);
      const maxDifference = Math.max(
        Math.abs(maxRating - question.expectedRating),
        Math.abs(minRating - question.expectedRating)
      );
      const proximityScore = 1 - (difference / maxDifference);
      return proximityScore * (question.maxScore || 1);
    }

    // Otherwise, score proportionally
    return ((rating - minRating) / (maxRating - minRating)) * (question.maxScore || 1);
  }

  /**
   * Text question scoring (keyword matching, length, etc.)
   */
  _calculateTextScore(question, response) {
    if (typeof response !== 'string') {
      return 0;
    }

    const text = response.trim().toLowerCase();

    // Keyword matching
    if (question.keywords && Array.isArray(question.keywords)) {
      const foundKeywords = question.keywords.filter(keyword =>
        text.includes(keyword.toLowerCase())
      );

      if (question.requireAllKeywords) {
        return foundKeywords.length === question.keywords.length ? (question.maxScore || 1) : 0;
      } else {
        return (foundKeywords.length / question.keywords.length) * (question.maxScore || 1);
      }
    }

    // Length-based scoring
    if (question.minLength || question.maxLength) {
      const length = text.length;
      const minLen = question.minLength || 0;
      const maxLen = question.maxLength || Infinity;

      if (length >= minLen && length <= maxLen) {
        return question.maxScore || 1;
      }

      if (this.options.partialCredit) {
        if (length < minLen) {
          return (length / minLen) * (question.maxScore || 1);
        } else if (length > maxLen) {
          return Math.max(0, 1 - ((length - maxLen) / maxLen)) * (question.maxScore || 1);
        }
      }

      return 0;
    }

    // Default: any non-empty response gets full credit
    return text.length > 0 ? (question.maxScore || 1) : 0;
  }

  /**
   * Number question scoring with range validation
   */
  _calculateNumberScore(question, response) {
    const number = Number(response);
    if (isNaN(number)) {
      return 0;
    }

    // Exact match
    if (question.correctAnswer !== undefined) {
      const tolerance = question.tolerance || 0;
      return Math.abs(number - question.correctAnswer) <= tolerance ? (question.maxScore || 1) : 0;
    }

    // Range validation
    if (question.minValue !== undefined || question.maxValue !== undefined) {
      const min = question.minValue !== undefined ? question.minValue : -Infinity;
      const max = question.maxValue !== undefined ? question.maxValue : Infinity;

      if (number >= min && number <= max) {
        return question.maxScore || 1;
      }

      if (this.options.partialCredit) {
        if (number < min) {
          const distance = min - number;
          const range = question.maxValue !== undefined ? question.maxValue - min : min;
          return Math.max(0, 1 - (distance / range)) * (question.maxScore || 1);
        } else if (number > max) {
          const distance = number - max;
          const range = question.minValue !== undefined ? max - question.minValue : max;
          return Math.max(0, 1 - (distance / range)) * (question.maxScore || 1);
        }
      }

      return 0;
    }

    // Default: any valid number gets full credit
    return question.maxScore || 1;
  }

  /**
   * Range question scoring (for slider inputs)
   */
  _calculateRangeScore(question, response) {
    return this._calculateNumberScore(question, response);
  }

  /**
   * Apply weight to score
   */
  _applyWeight(score, weight) {
    if (!this.options.weightedScoring || weight === undefined) {
      return score;
    }
    return score * (weight || 1.0);
  }

  /**
   * Apply time-based adjustments
   */
  _applyTimeAdjustment(score, timeSpent, question) {
    if (!this.options.timeBasedScoring || !timeSpent || !question.expectedTime) {
      return score;
    }

    const ratio = timeSpent / question.expectedTime;

    // Bonus for completing quickly (within reasonable bounds)
    if (ratio < 0.5) {
      return score * 1.1; // 10% bonus
    }

    // Penalty for taking too long
    if (ratio > 2.0) {
      return score * 0.9; // 10% penalty
    }

    return score;
  }

  /**
   * Calculate section score with nested structure support
   */
  calculateSectionScore(section, responses, context = {}) {
    if (!section || !section.id) {
      throw new Error('Invalid section object');
    }

    let totalScore = 0;
    let maxScore = 0;
    const questionResults = [];

    // Process direct questions
    if (section.questions && Array.isArray(section.questions)) {
      section.questions.forEach(question => {
        const response = responses[question.id];
        const questionResult = this.calculateQuestionScore(question, response, context);

        questionResults.push(questionResult);
        totalScore += questionResult.score;
        maxScore += questionResult.maxScore;
      });
    }

    // Process nested structures
    const nestedResults = [];
    ['subsections', 'categories'].forEach(key => {
      if (section[key] && Array.isArray(section[key])) {
        section[key].forEach(nestedSection => {
          const nestedResult = this.calculateSectionScore(nestedSection, responses, context);
          nestedResults.push(nestedResult);
          totalScore += nestedResult.score;
          maxScore += nestedResult.maxScore;
        });
      }
    });

    // Apply section-level constraints
    const sectionMaxScore = section.maxScore || maxScore;
    const cappedScore = Math.min(totalScore, sectionMaxScore);

    return this.createSectionResult(cappedScore, sectionMaxScore, section.id, {
      questionResults,
      nestedResults,
      title: section.title,
      weight: section.weight
    });
  }

  /**
   * Calculate total assessment score
   */
  calculateAssessmentScore(assessment, responses, context = {}) {
    if (!assessment || !assessment.sections) {
      throw new Error('Invalid assessment object');
    }

    let totalScore = 0;
    let maxScore = 0;
    const sectionResults = [];

    assessment.sections.forEach(section => {
      const sectionResult = this.calculateSectionScore(section, responses, context);
      sectionResults.push(sectionResult);

      // Apply section weight if weighted scoring is enabled
      if (this.options.weightedScoring && section.weight) {
        totalScore += sectionResult.score * section.weight;
        maxScore += sectionResult.maxScore * section.weight;
      } else {
        totalScore += sectionResult.score;
        maxScore += sectionResult.maxScore;
      }
    });

    // Apply assessment-level constraints
    const assessmentMaxScore = assessment.maxScore || maxScore;
    const finalScore = Math.min(totalScore, assessmentMaxScore);
    const percentage = this.calculatePercentage(finalScore, assessmentMaxScore);

    return this.createAssessmentResult(finalScore, assessmentMaxScore, percentage, {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      sectionResults,
      responses: Object.keys(responses).length,
      context
    });
  }

  /**
   * Calculate percentage with proper rounding
   */
  calculatePercentage(score, maxScore, precision = null) {
    if (maxScore === 0) return 0;

    const percentage = (score / maxScore) * 100;
    const roundingPrecision = precision !== null ? precision : this.options.roundingPrecision;

    return Math.round(percentage * Math.pow(10, roundingPrecision)) / Math.pow(10, roundingPrecision);
  }

  /**
   * Get detailed score breakdown
   */
  getScoreBreakdown(assessment, responses, context = {}) {
    const assessmentResult = this.calculateAssessmentScore(assessment, responses, context);

    return {
      ...assessmentResult,
      breakdown: {
        bySection: assessmentResult.metadata.sectionResults.map(section => ({
          id: section.id,
          title: section.metadata.title,
          score: section.score,
          maxScore: section.maxScore,
          percentage: this.calculatePercentage(section.score, section.maxScore),
          questionsCount: section.metadata.questionResults ? section.metadata.questionResults.length : 0
        })),
        byQuestionType: this._getQuestionTypeBreakdown(assessment, responses),
        performance: this._getPerformanceMetrics(assessmentResult),
        recommendations: this._generateRecommendations(assessmentResult)
      }
    };
  }

  /**
   * Get breakdown by question type
   */
  _getQuestionTypeBreakdown(assessment, responses) {
    const typeStats = {};

    const processSection = (section) => {
      if (section.questions) {
        section.questions.forEach(question => {
          const type = question.type || 'unknown';
          if (!typeStats[type]) {
            typeStats[type] = { total: 0, answered: 0, correct: 0, totalScore: 0, maxScore: 0 };
          }

          typeStats[type].total++;
          typeStats[type].maxScore += question.maxScore || 1;

          const response = responses[question.id];
          if (response !== undefined && response !== null) {
            typeStats[type].answered++;
            const result = this.calculateQuestionScore(question, response);
            typeStats[type].totalScore += result.score;
            if (result.score === result.maxScore) {
              typeStats[type].correct++;
            }
          }
        });
      }

      ['subsections', 'categories'].forEach(key => {
        if (section[key]) {
          section[key].forEach(processSection);
        }
      });
    };

    assessment.sections.forEach(processSection);

    // Calculate percentages
    Object.keys(typeStats).forEach(type => {
      const stats = typeStats[type];
      stats.answerRate = stats.total > 0 ? (stats.answered / stats.total) * 100 : 0;
      stats.accuracy = stats.answered > 0 ? (stats.correct / stats.answered) * 100 : 0;
      stats.scorePercentage = stats.maxScore > 0 ? (stats.totalScore / stats.maxScore) * 100 : 0;
    });

    return typeStats;
  }

  /**
   * Get performance metrics
   */
  _getPerformanceMetrics(result) {
    return {
      overall: result.percentage,
      grade: this._calculateGrade(result.percentage),
      level: this._getPerformanceLevel(result.percentage),
      trend: 'stable' // This would require historical data
    };
  }

  /**
   * Calculate letter grade
   */
  _calculateGrade(percentage) {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 87) return 'A-';
    if (percentage >= 83) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 77) return 'B-';
    if (percentage >= 73) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 67) return 'C-';
    if (percentage >= 63) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Get performance level
   */
  _getPerformanceLevel(percentage) {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Satisfactory';
    if (percentage >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  }

  /**
   * Generate recommendations based on performance
   */
  _generateRecommendations(result) {
    const recommendations = [];

    if (result.percentage < 60) {
      recommendations.push('Consider reviewing the fundamental concepts covered in this assessment.');
    }

    if (result.percentage >= 60 && result.percentage < 80) {
      recommendations.push('Good progress! Focus on areas where you scored below average.');
    }

    if (result.percentage >= 80) {
      recommendations.push('Excellent work! You demonstrate strong understanding of the material.');
    }

    // Add section-specific recommendations
    result.metadata.sectionResults.forEach(section => {
      const sectionPercentage = this.calculatePercentage(section.score, section.maxScore);
      if (sectionPercentage < 50) {
        recommendations.push(`Pay special attention to "${section.metadata.title}" - additional study recommended.`);
      }
    });

    return recommendations;
  }

  /**
   * Create standardized score result object
   */
  createScoreResult(score, maxScore, id, metadata = {}) {
    return {
      id,
      score: this._roundScore(score),
      maxScore: this._roundScore(maxScore),
      percentage: this.calculatePercentage(score, maxScore),
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create standardized section result object
   */
  createSectionResult(score, maxScore, id, metadata = {}) {
    return {
      id,
      score: this._roundScore(score),
      maxScore: this._roundScore(maxScore),
      percentage: this.calculatePercentage(score, maxScore),
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create standardized assessment result object
   */
  createAssessmentResult(score, maxScore, percentage, metadata = {}) {
    return {
      score: this._roundScore(score),
      maxScore: this._roundScore(maxScore),
      percentage,
      grade: this._calculateGrade(percentage),
      level: this._getPerformanceLevel(percentage),
      metadata,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Round score to specified precision
   */
  _roundScore(score) {
    return Math.round(score * Math.pow(10, this.options.roundingPrecision))
           / Math.pow(10, this.options.roundingPrecision);
  }

  /**
   * Validate responses against assessment structure
   */
  validateResponses(assessment, responses) {
    const issues = [];
    const requiredQuestions = [];

    const validateSection = (section, path = []) => {
      const currentPath = [...path, section.id];

      if (section.questions) {
        section.questions.forEach(question => {
          if (question.required) {
            requiredQuestions.push({ ...question, path: currentPath });

            const response = responses[question.id];
            if (response === undefined || response === null) {
              issues.push({
                type: 'missing_required',
                questionId: question.id,
                path: currentPath,
                message: `Required question "${question.text}" is missing a response`
              });
            }
          }

          // Validate response format
          const response = responses[question.id];
          if (response !== undefined && response !== null) {
            try {
              this._validateResponseFormat(question, response);
            } catch (error) {
              issues.push({
                type: 'invalid_format',
                questionId: question.id,
                path: currentPath,
                message: error.message
              });
            }
          }
        });
      }

      ['subsections', 'categories'].forEach(key => {
        if (section[key]) {
          section[key].forEach(nested => validateSection(nested, currentPath));
        }
      });
    };

    assessment.sections.forEach(section => validateSection(section));

    return {
      isValid: issues.length === 0,
      issues,
      requiredQuestions: requiredQuestions.length,
      requiredAnswered: requiredQuestions.filter(q =>
        responses[q.id] !== undefined && responses[q.id] !== null
      ).length
    };
  }

  /**
   * Validate response format for a specific question
   */
  _validateResponseFormat(question, response) {
    switch (question.type) {
      case 'boolean':
        if (typeof response !== 'boolean') {
          throw new Error(`Boolean response required for question ${question.id}`);
        }
        break;

      case 'composite':
        if (typeof response !== 'object' || response === null) {
          throw new Error(`Object response required for composite question ${question.id}`);
        }
        break;

      case 'choice':
        if (question.multiple) {
          if (!Array.isArray(response)) {
            throw new Error(`Array response required for multiple choice question ${question.id}`);
          }
        }
        break;

      case 'number':
      case 'rating':
      case 'range':
        if (typeof response !== 'number' && isNaN(Number(response))) {
          throw new Error(`Numeric response required for question ${question.id}`);
        }
        break;

      case 'text':
        if (typeof response !== 'string') {
          throw new Error(`String response required for text question ${question.id}`);
        }
        break;
    }
  }
}

// Export default instance with standard options
export default new ScoreCalculator();

// Export factory function for custom configurations
export const createScoreCalculator = (options) => new ScoreCalculator(options);
