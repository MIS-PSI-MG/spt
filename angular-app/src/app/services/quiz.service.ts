import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError, interval } from 'rxjs';
import { map, catchError, tap, switchMap, take } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import {
  Assessment,
  Question,
  QuizQuestion,
  AssessmentResponse,
  ResponseValue,
  CompositeResponse,
  MatrixResponse
} from '../interfaces/assessment.interface';
import {
  QuizSession,
  QuizResults,
  DetailedAnalysis,
  QuizProgress,
  CompletionValidation,
  ValidationResult,
  ValidationIssue,
  QuestionAnalysis,
  TimeAnalysis,
  StrengthWeakness
} from '../interfaces/scoring.interface';
import {
  IQuizService,
  QuizContent,
  ResponseSubmissionResult,
  QuizStatistics,
  ResultsComparison
} from '../interfaces/services.interface';
import { BackofficeContentService } from './backoffice-content.service';

@Injectable({
  providedIn: 'root'
})
export class QuizService implements IQuizService {
  private sessions = new Map<string, QuizSession>();
  private sessionResponses = new Map<string, Map<string, ResponseValue>>();
  private sessionQuestions = new Map<string, QuizQuestion[]>();
  private sessionSubject = new BehaviorSubject<QuizSession | null>(null);
  public currentSession$ = this.sessionSubject.asObservable();

  private progressSubject = new BehaviorSubject<QuizProgress | null>(null);
  public progress$ = this.progressSubject.asObservable();

  constructor(private backofficeService: BackofficeContentService) {}

  // Quiz Session Management
  startQuiz(assessmentId: string): Observable<QuizSession> {
    return this.loadQuizContent(assessmentId).pipe(
      map(content => {
        const session: QuizSession = {
          quizId: this.generateId('session'),
          startTime: new Date(),
          totalQuestions: content.totalQuestions,
          maxScore: content.maxScore,
          estimatedDuration: content.estimatedDuration,
          currentQuestionIndex: 0,
          isCompleted: false
        };

        this.sessions.set(session.quizId, session);
        this.sessionResponses.set(session.quizId, new Map());
        this.sessionQuestions.set(session.quizId, content.questions);
        this.sessionSubject.next(session);
        this.updateProgress(session.quizId);

        return session;
      })
    );
  }

  loadQuizContent(assessmentId: string): Observable<QuizContent> {
    return this.backofficeService.getAssessment(assessmentId).pipe(
      map(assessment => {
        const questions = this.extractAllQuestions(assessment);
        return {
          assessment: this.sanitizeAssessment(assessment),
          questions,
          totalQuestions: questions.length,
          maxScore: assessment.maxScore,
          estimatedDuration: this.estimateCompletionTime(assessment)
        };
      })
    );
  }

  resumeQuiz(sessionId: string): Observable<QuizSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (session.isCompleted) {
      return throwError(() => new Error(`Session ${sessionId} is already completed`));
    }

    this.sessionSubject.next(session);
    this.updateProgress(sessionId);
    return of(session);
  }

  pauseQuiz(sessionId: string): Observable<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    // Save current state (in real implementation, this would persist to storage)
    return of(true);
  }

  completeQuiz(sessionId: string): Observable<QuizResults> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (session.isCompleted) {
      return throwError(() => new Error(`Session ${sessionId} is already completed`));
    }

    // Validate completeness
    return this.validateCompleteness(sessionId).pipe(
      switchMap(validation => {
        if (!validation.isComplete) {
          return throwError(() => new Error(`Missing required responses: ${validation.missing.join(', ')}`));
        }

        session.endTime = new Date();
        session.isCompleted = true;
        this.sessions.set(sessionId, session);

        return this.calculateResults(sessionId);
      })
    );
  }

  abandonQuiz(sessionId: string): Observable<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return of(false);
    }

    this.sessions.delete(sessionId);
    this.sessionResponses.delete(sessionId);
    this.sessionQuestions.delete(sessionId);
    this.sessionSubject.next(null);
    this.progressSubject.next(null);

    return of(true);
  }

  // Response Management
  submitResponse(sessionId: string, questionId: string, response: ResponseValue): Observable<ResponseSubmissionResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (session.isCompleted) {
      return throwError(() => new Error('Quiz has already been completed'));
    }

    const questions = this.sessionQuestions.get(sessionId);
    if (!questions) {
      return throwError(() => new Error('Session questions not found'));
    }

    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return throwError(() => new Error(`Question ${questionId} not found`));
    }

    return this.validateResponse(questionId, response).pipe(
      map(validation => {
        if (!validation.isValid) {
          throw new Error(`Invalid response: ${validation.issues.map(i => i.message).join(', ')}`);
        }

        const responses = this.sessionResponses.get(sessionId)!;
        responses.set(questionId, response);

        const currentScore = this.calculateCurrentScore(sessionId);
        const progress = this.getProgressForSession(sessionId);
        this.updateProgress(sessionId);

        return {
          questionId,
          accepted: true,
          currentScore,
          progress,
          validation
        };
      })
    );
  }

  updateResponse(sessionId: string, questionId: string, response: ResponseValue): Observable<ResponseSubmissionResult> {
    // Same logic as submitResponse for this implementation
    return this.submitResponse(sessionId, questionId, response);
  }

  getResponse(sessionId: string, questionId: string): Observable<ResponseValue> {
    const responses = this.sessionResponses.get(sessionId);
    if (!responses) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const response = responses.get(questionId);
    return of(response);
  }

  getAllResponses(sessionId: string): Observable<AssessmentResponse> {
    const responses = this.sessionResponses.get(sessionId);
    if (!responses) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const assessmentResponse: AssessmentResponse = {};
    responses.forEach((value, key) => {
      assessmentResponse[key] = value;
    });

    return of(assessmentResponse);
  }

  clearResponse(sessionId: string, questionId: string): Observable<boolean> {
    const responses = this.sessionResponses.get(sessionId);
    if (!responses) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const deleted = responses.delete(questionId);
    if (deleted) {
      this.updateProgress(sessionId);
    }

    return of(deleted);
  }

  // Navigation
  getCurrentQuestion(sessionId: string): Observable<QuizQuestion> {
    const session = this.sessions.get(sessionId);
    const questions = this.sessionQuestions.get(sessionId);

    if (!session || !questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const currentQuestion = questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      return throwError(() => new Error('No current question available'));
    }

    return of(currentQuestion);
  }

  getNextQuestion(sessionId: string): Observable<QuizQuestion> {
    const session = this.sessions.get(sessionId);
    const questions = this.sessionQuestions.get(sessionId);

    if (!session || !questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (session.currentQuestionIndex < questions.length - 1) {
      session.currentQuestionIndex++;
      this.sessions.set(sessionId, session);
      this.sessionSubject.next(session);
      return of(questions[session.currentQuestionIndex]);
    }

    return throwError(() => new Error('No next question available'));
  }

  getPreviousQuestion(sessionId: string): Observable<QuizQuestion> {
    const session = this.sessions.get(sessionId);
    const questions = this.sessionQuestions.get(sessionId);

    if (!session || !questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (session.currentQuestionIndex > 0) {
      session.currentQuestionIndex--;
      this.sessions.set(sessionId, session);
      this.sessionSubject.next(session);
      return of(questions[session.currentQuestionIndex]);
    }

    return throwError(() => new Error('No previous question available'));
  }

  goToQuestion(sessionId: string, questionId: string): Observable<QuizQuestion> {
    const session = this.sessions.get(sessionId);
    const questions = this.sessionQuestions.get(sessionId);

    if (!session || !questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const index = questions.findIndex(q => q.id === questionId);
    if (index === -1) {
      return throwError(() => new Error(`Question ${questionId} not found`));
    }

    session.currentQuestionIndex = index;
    this.sessions.set(sessionId, session);
    this.sessionSubject.next(session);
    return of(questions[index]);
  }

  getQuestionByIndex(sessionId: string, index: number): Observable<QuizQuestion> {
    const questions = this.sessionQuestions.get(sessionId);
    if (!questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (index < 0 || index >= questions.length) {
      return throwError(() => new Error(`Invalid question index: ${index}`));
    }

    return of(questions[index]);
  }

  // Progress and Validation
  getProgress(sessionId: string): Observable<QuizProgress> {
    const progress = this.getProgressForSession(sessionId);
    return of(progress);
  }

  validateCompleteness(sessionId: string): Observable<CompletionValidation> {
    const questions = this.sessionQuestions.get(sessionId);
    const responses = this.sessionResponses.get(sessionId);

    if (!questions || !responses) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const requiredQuestions = questions.filter(q => q.required);
    const missing = requiredQuestions
      .filter(q => !responses.has(q.id))
      .map(q => q.id);

    const validation: CompletionValidation = {
      isComplete: missing.length === 0,
      missing,
      totalRequired: requiredQuestions.length,
      completedRequired: requiredQuestions.length - missing.length
    };

    return of(validation);
  }

  validateResponse(questionId: string, response: ResponseValue): Observable<ValidationResult> {
    // Basic validation - in real implementation, this would be more comprehensive
    const issues: ValidationIssue[] = [];

    if (response === undefined || response === null) {
      issues.push({
        type: 'missing_required',
        questionId,
        path: [questionId],
        message: 'Response is required'
      });
    }

    const result: ValidationResult = {
      isValid: issues.length === 0,
      issues,
      requiredQuestions: 1,
      requiredAnswered: issues.length === 0 ? 1 : 0
    };

    return of(result);
  }

  getCurrentScore(sessionId: string): Observable<number> {
    const score = this.calculateCurrentScore(sessionId);
    return of(score);
  }

  // Results and Analytics
  getQuizResults(sessionId: string): Observable<QuizResults> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    if (!session.isCompleted) {
      return throwError(() => new Error('Quiz must be completed to get results'));
    }

    return this.calculateResults(sessionId);
  }

  getDetailedAnalysis(sessionId: string): Observable<DetailedAnalysis> {
    return this.getQuizResults(sessionId).pipe(
      switchMap(results => {
        const questions = this.sessionQuestions.get(sessionId)!;
        const responses = this.sessionResponses.get(sessionId)!;

        const questionAnalysis: QuestionAnalysis[] = questions.map(question => {
          const response = responses.get(question.id);
          const score = response !== undefined ? this.calculateQuestionScore(question, response) : 0;

          return {
            questionId: question.id,
            questionText: question.text,
            questionType: question.type,
            required: question.required,
            answered: response !== undefined,
            response,
            score,
            maxScore: question.maxScore,
            sectionTitle: question.sectionTitle || 'Unknown Section'
          };
        });

        const timeAnalysis = this.calculateTimeAnalysis(sessionId);
        const strengths = this.identifyStrengths(questionAnalysis);
        const weaknesses = this.identifyWeaknesses(questionAnalysis);

        const analysis: DetailedAnalysis = {
          ...results,
          questionAnalysis,
          timePerQuestion: timeAnalysis,
          strengths,
          weaknesses
        };

        return of(analysis);
      })
    );
  }

  exportResults(sessionId: string, format = 'json'): Observable<string> {
    return this.getDetailedAnalysis(sessionId).pipe(
      map(analysis => {
        switch (format) {
          case 'json':
            return JSON.stringify(analysis, null, 2);
          case 'csv':
            return this.convertResultsToCSV(analysis);
          case 'pdf':
            // In real implementation, this would generate PDF
            return 'PDF export not implemented';
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      })
    );
  }

  compareResults(sessionIds: string[]): Observable<ResultsComparison> {
    const comparisons = sessionIds.map(id => this.getQuizResults(id));

    return of(comparisons).pipe(
      switchMap(resultObservables => {
        // In real implementation, this would properly handle multiple observables
        const comparison: ResultsComparison = {
          sessions: sessionIds,
          comparisons: {
            scores: [0, 0], // Mock data
            percentages: [0, 0],
            completionTimes: [0, 0],
            sectionComparisons: []
          },
          insights: ['Mock comparison insight']
        };
        return of(comparison);
      })
    );
  }

  // Question Management
  getAllQuestions(sessionId: string): Observable<QuizQuestion[]> {
    const questions = this.sessionQuestions.get(sessionId);
    if (!questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }
    return of(questions);
  }

  getQuestionById(sessionId: string, questionId: string): Observable<QuizQuestion> {
    const questions = this.sessionQuestions.get(sessionId);
    if (!questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return throwError(() => new Error(`Question ${questionId} not found`));
    }

    return of(question);
  }

  getQuestionsBySection(sessionId: string, sectionId: string): Observable<QuizQuestion[]> {
    const questions = this.sessionQuestions.get(sessionId);
    if (!questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const sectionQuestions = questions.filter(q =>
      q.sectionPath && q.sectionPath.includes(sectionId)
    );
    return of(sectionQuestions);
  }

  searchQuestions(sessionId: string, query: string): Observable<QuizQuestion[]> {
    const questions = this.sessionQuestions.get(sessionId);
    if (!questions) {
      return throwError(() => new Error(`Session ${sessionId} not found`));
    }

    const searchTerm = query.toLowerCase();
    const filteredQuestions = questions.filter(q =>
      q.text.toLowerCase().includes(searchTerm) ||
      q.helpText?.toLowerCase().includes(searchTerm)
    );

    return of(filteredQuestions);
  }

  // Utility Methods
  estimateCompletionTime(assessmentId: string): Observable<number> {
    return this.backofficeService.getAssessment(assessmentId).pipe(
      map(assessment => this.estimateCompletionTime(assessment))
    );
  }

  getQuizStatistics(assessmentId: string): Observable<QuizStatistics> {
    // Mock statistics - in real implementation, this would aggregate actual data
    const stats: QuizStatistics = {
      totalAttempts: 150,
      completionRate: 85,
      averageScore: 75,
      averageTime: 1800000, // 30 minutes in milliseconds
      commonMistakes: ['Question validation errors', 'Incomplete responses'],
      bestPerformingSections: ['Section 1', 'Section 2'],
      worstPerformingSections: ['Section 3']
    };

    return of(stats);
  }

  saveProgress(sessionId: string): Observable<boolean> {
    // In real implementation, this would persist to storage/database
    return of(true);
  }

  getSessionHistory(userId?: string): Observable<QuizSession[]> {
    // Filter sessions by user if provided
    const sessions = Array.from(this.sessions.values());
    return of(sessions);
  }

  // Private Methods
  private extractAllQuestions(assessment: Assessment): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    const extractFromSection = (section: any, path: string[] = []) => {
      const currentPath = [...path, section.id];

      if (section.questions) {
        section.questions.forEach((question: Question) => {
          const quizQuestion: QuizQuestion = {
            ...question,
            sectionPath: currentPath,
            sectionTitle: section.title,
            containerTitle: section.title,
            fullPath: currentPath.join(' > ')
          };
          questions.push(quizQuestion);

          // Add sub-questions for composite questions
          if (question.type === 'composite' && question.subQuestions) {
            question.subQuestions.forEach(subQ => {
              const subQuizQuestion: QuizQuestion = {
                ...subQ,
                parentId: question.id,
                sectionPath: [...currentPath, question.id],
                sectionTitle: section.title,
                containerTitle: question.text,
                fullPath: [...currentPath, question.id].join(' > '),
                isSubQuestion: true
              };
              questions.push(subQuizQuestion);
            });
          }

          // Add matrix data for M&E questions
          if (question.type === 'data_validation_matrix' && question.monthlyData) {
            question.monthlyData.forEach(monthData => {
              const matrixQuestion: QuizQuestion = {
                ...monthData,
                text: `${question.text} - ${monthData.month}`,
                type: 'data_validation_matrix',
                maxScore: 1,
                weight: 1.0,
                required: question.required,
                parentId: question.id,
                sectionPath: [...currentPath, question.id],
                sectionTitle: section.title,
                containerTitle: question.text,
                fullPath: [...currentPath, question.id, monthData.month].join(' > '),
                isMatrixData: true
              };
              questions.push(matrixQuestion);
            });
          }
        });
      }

      // Process nested structures
      ['subsections', 'categories'].forEach(key => {
        if (section[key]) {
          section[key].forEach((item: any) => {
            extractFromSection(item, currentPath);
          });
        }
      });
    };

    assessment.sections.forEach(section => {
      extractFromSection(section);
    });

    return questions;
  }

  private sanitizeAssessment(assessment: Assessment): Assessment {
    // Remove any sensitive backoffice data
    return {
      ...assessment,
      metadata: {
        ...assessment.metadata,
        createdBy: undefined // Remove creator info for quiz takers
      }
    };
  }

  private estimateCompletionTime(assessment: Assessment): number {
    const questionCount = this.countQuestions(assessment);
    return questionCount * 30 * 1000; // 30 seconds per question
  }

  private countQuestions(assessment: Assessment): number {
    let count = 0;

    const countInSection = (section: any) => {
      if (section.questions) {
        count += section.questions.length;
        section.questions.forEach((question: Question) => {
          if (question.subQuestions) {
            count += question.subQuestions.length;
          }
          if (question.monthlyData) {
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

    assessment.sections.forEach(countInSection);
    return count;
  }

  private calculateCurrentScore(sessionId: string): number {
    const questions = this.sessionQuestions.get(sessionId);
    const responses = this.sessionResponses.get(sessionId);

    if (!questions || !responses) {
      return 0;
    }

    let totalScore = 0;
    questions.forEach(question => {
      const response = responses.get(question.id);
      if (response !== undefined) {
        totalScore += this.calculateQuestionScore(question, response);
      }
    });

    return totalScore;
  }

  private calculateQuestionScore(question: QuizQuestion, response: ResponseValue): number {
    switch (question.type) {
      case 'boolean':
        return response === true ? question.maxScore * question.weight : 0;

      case 'composite':
        if (typeof response === 'object' && response !== null) {
          let score = 0;
          if (question.subQuestions) {
            question.subQuestions.forEach(subQ => {
              const subResponse = (response as CompositeResponse)[subQ.id];
              if (subResponse === true) {
                score += subQ.maxScore * subQ.weight;
              }
            });
          }
          return score;
        }
        return 0;

      case 'data_validation_matrix':
        if (typeof response === 'object' && response !== null) {
          const matrixResponse = response as MatrixResponse;
          // Score based on concordance
          return matrixResponse.concordance ? question.maxScore * question.weight : 0;
        }
        return 0;

      case 'choice':
        // Assume correctAnswer is available in quiz context
        return response === question.correctAnswer ? question.maxScore * question.weight : 0;

      case 'rating':
        if (typeof response === 'number') {
          return (response / 5) * question.maxScore * question.weight;
        }
        return 0;

      case 'text':
      case 'number':
        // For open-ended questions, assume full credit if answered
        return response ? question.maxScore * question.weight : 0;

      default:
        return 0;
    }
  }

  private getProgressForSession(sessionId: string): QuizProgress {
    const questions = this.sessionQuestions.get(sessionId);
    const responses = this.sessionResponses.get(sessionId);

    if (!questions || !responses) {
      return {
        answered: 0,
        total: 0,
        percentage: 0,
        isComplete: false
      };
    }

    const answered = responses.size;
    const total = questions.length;
    const percentage = Math.round((answered / total) * 100);

    return {
      answered,
      total,
      percentage,
      isComplete: answered === total
    };
  }

  private updateProgress(sessionId: string): void {
    const progress = this.getProgressForSession(sessionId);
    this.progressSubject.next(progress);
  }

  private calculateResults(sessionId: string): Observable<QuizResults> {
    const session = this.sessions.get(sessionId)!;
    const questions = this.sessionQuestions.get(sessionId)!;
    const responses = this.sessionResponses.get(sessionId)!;

    const totalScore = this.calculateCurrentScore(sessionId);
    const maxScore = questions.reduce((sum, q) => sum + q.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100 * 100) / 100;
    const duration = (session.endTime!.getTime() - session.startTime.getTime());

    const results: QuizResults = {
      quizId: session.quizId,
      quizTitle: 'Assessment Results',
      startTime: session.startTime,
      endTime: session.endTime!,
      duration,
      totalScore,
      maxScore,
      percentage,
      grade: this.calculateGrade(percentage),
      sectionResults: [], // Would be calculated based on sections
      questionsAnswered: responses.size,
      totalQuestions: questions.length,
      completionRate: Math.round((responses.size / questions.length) * 100)
    };

    return of(results);
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  private calculateTimeAnalysis(sessionId: string): TimeAnalysis {
    const session = this.sessions.get(sessionId)!;
    const questions = this.sessionQuestions.get(sessionId)!;

    if (!session.endTime) {
      return {
        total: 0,
        average: 0,
        perQuestion: 0
      };
    }

    const totalTime = session.endTime.getTime() - session.startTime.getTime();
    const averageTime = totalTime / questions.length;

    return {
      total: totalTime,
      average: averageTime,
      perQuestion: Math.round(averageTime / 1000) // in seconds
    };
  }

  private identifyStrengths(questionAnalysis: QuestionAnalysis[]): StrengthWeakness[] {
    return questionAnalysis
      .filter(q => q.answered && q.score === q.maxScore)
      .map(q => ({
        section: q.sectionTitle,
        question: q.questionText,
        score: q.score
      }));
  }

  private identifyWeaknesses(questionAnalysis: QuestionAnalysis[]): StrengthWeakness[] {
    return questionAnalysis
      .filter(q => !q.answered || q.score < q.maxScore)
      .map(q => ({
        section: q.sectionTitle,
        question: q.questionText,
        score: q.score || 0,
        maxScore: q.maxScore,
        reason: !q.answered ? 'Not answered' : 'Incorrect answer'
      }));
  }

  private convertResultsToCSV(analysis: DetailedAnalysis): string {
    const headers = [
      'Question ID',
      'Section',
      'Question Text',
      'Type',
      'Answer',
      'Score',
      'Max Score',
      'Correct'
    ];
    const rows = [headers];

    analysis.questionAnalysis.forEach(q => {
      rows.push([
        q.questionId,
        q.sectionTitle,
        q.questionText,
        q.questionType,
        String(q.response || 'Not answered'),
        q.score.toString(),
        q.maxScore.toString(),
        q.score === q.maxScore ? 'Yes' : 'No'
      ]);
    });

    return rows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  private generateId(prefix = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
