import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Editor } from '../../interfaces/checklist.editor.interface';
import { ChecklistEditorStore } from '../../services/checklist-editor.store';
import { ChecklistFormService, type ChecklistForm } from '../../services/checklist-form.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checklist-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="checklist-editor">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Checklist Editor</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="checklistForm" (ngSubmit)="onSubmit()">
            <!-- Basic Info Section -->
            <mat-card class="section">
              <mat-card-header>
                <mat-card-title>Checklist Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="form-row">
                  <mat-form-field>
                    <mat-label>Title</mat-label>
                    <input matInput formControlName="title" required>
                  </mat-form-field>
                  
                  <mat-form-field>
                    <mat-label>Department</mat-label>
                    <input matInput formControlName="departement" required>
                  </mat-form-field>
                  
                  <mat-form-field>
                    <mat-label>Level</mat-label>
                    <input matInput type="number" formControlName="niveau" min="1" required>
                  </mat-form-field>
                </div>
                
                <div formGroupName="metadata" class="metadata-section">
                  <h3>Metadata</h3>
                  <div class="form-row">
                    <mat-form-field>
                      <mat-label>Version</mat-label>
                      <input matInput formControlName="version" required>
                    </mat-form-field>
                    
                    <mat-form-field>
                      <mat-label>Category</mat-label>
                      <input matInput formControlName="category" required>
                    </mat-form-field>
                    
                    <mat-form-field>
                      <mat-label>Author</mat-label>
                      <input matInput formControlName="author">
                    </mat-form-field>
                  </div>
                  
                  <mat-form-field class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="2"></textarea>
                  </mat-form-field>
                </div>
              </mat-card-content>
            </mat-card>
            
            <!-- Sections -->
            <mat-accordion multi>
              <mat-expansion-panel *ngFor="let section of sections.controls; let i = index" [formGroup]="getSectionGroup(i)">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    Section {{i + 1}}: {{section.get('title')?.value || 'Untitled Section'}}
                  </mat-panel-title>
                </mat-expansion-panel-header>
                
                <div class="section-actions">
                  <button mat-icon-button color="warn" (click)="removeSection(i)" type="button">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                
                <mat-form-field class="full-width">
                  <mat-label>Section Title</mat-label>
                  <input matInput formControlName="title" required>
                </mat-form-field>
                
                <!-- Subsections would be rendered here -->
                
                <!-- Questions in this section -->
                <div formArrayName="questions">
                  <div *ngFor="let question of getSectionQuestions(i).controls; let j = index" [formGroup]="getQuestionGroup(i, j)">
                    <!-- Question content -->
                    <div class="question">
                      <mat-form-field class="full-width">
                        <mat-label>Question {{j + 1}}</mat-label>
                        <input matInput formControlName="text" required>
                        <button mat-icon-button color="warn" (click)="removeQuestion(i, j)" type="button">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-form-field>
                      
                      <mat-form-field>
                        <mat-label>Type</mat-label>
                        <mat-select formControlName="type">
                          <mat-option value="boolean">Yes/No</mat-option>
                          <mat-option value="number">Number</mat-option>
                          <mat-option value="text">Text</mat-option>
                          <mat-option value="composite">Composite</mat-option>
                          <mat-option value="data_validation_matrix">Data Validation Matrix</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <mat-checkbox formControlName="required">Required</mat-checkbox>
                      
                      <!-- More question details would go here -->
                    </div>
                  </div>
                  
                  <button mat-button type="button" (click)="addQuestion(i)">
                    <mat-icon>add</mat-icon> Add Question
                  </button>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
            
            <div class="actions">
              <button mat-button type="button" (click)="addSection()">
                <mat-icon>add</mat-icon> Add Section
              </button>
              
              <button mat-raised-button color="primary" type="submit" [disabled]="!checklistForm.valid">
                Save Checklist
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .checklist-editor {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    
    mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .section-actions {
      position: absolute;
      right: 16px;
      top: 16px;
    }
    
    .question {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      position: relative;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
    }
  `]
})
export class ChecklistEditorComponent implements OnInit, OnDestroy {
  private store = inject(ChecklistEditorStore);
  private formService = inject(ChecklistFormService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  checklistForm!: ChecklistForm;
  private storeSubscription?: Subscription;

  ngOnInit() {
    this.initializeForm();
    this.setupStoreSubscription();
  }

  ngOnDestroy() {
    this.storeSubscription?.unsubscribe();
  }

  private initializeForm() {
    this.checklistForm = this.formService.createChecklistForm();
  }

  private setupStoreSubscription() {
    this.storeSubscription = this.store.checklist.subscribe(({ checklist, loading, error }) => {
      if (error) {
        this.snackBar.open(`Error: ${error}`, 'Close', { duration: 5000 });
      }
      
      if (checklist) {
        this.checklistForm = this.formService.createChecklistForm(checklist);
      }
    });
  }

  // Form getters
  get sections(): FormArray {
    return this.checklistForm.get('sections') as FormArray;
  }

  getSectionGroup(index: number): FormGroup {
    return this.sections.at(index) as FormGroup;
  }

  getSectionQuestions(sectionIndex: number): FormArray {
    return this.getSectionGroup(sectionIndex).get('questions') as FormArray;
  }

  getQuestionGroup(sectionIndex: number, questionIndex: number): FormGroup {
    return this.getSectionQuestions(sectionIndex).at(questionIndex) as FormGroup;
  }

  // Section actions
  addSection() {
    const newSection: Editor.Section = {
      id: this.formService.generateId(),
      title: 'New Section',
      questions: []
    };
    
    this.sections.push(this.formService.createSectionGroup(newSection));
  }

  removeSection(index: number) {
    this.sections.removeAt(index);
  }

  // Question actions
  addQuestion(sectionIndex: number) {
    const questions = this.getSectionQuestions(sectionIndex);
    const newQuestion: Editor.Question = {
      id: this.formService.generateId(),
      text: '',
      type: 'text',
      required: false
    };
    
    questions.push(this.formService.createQuestionGroup(newQuestion));
  }

  removeQuestion(sectionIndex: number, questionIndex: number) {
    const questions = this.getSectionQuestions(sectionIndex);
    questions.removeAt(questionIndex);
  }

  // Form submission
  onSubmit() {
    if (this.checklistForm.valid) {
      this.store.updateChecklist(this.checklistForm.value as Editor.ChecklistTemplate);
      this.snackBar.open('Checklist saved successfully!', 'Close', { duration: 3000 });
    }
  }
}
