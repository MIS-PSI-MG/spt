import { Injectable, signal } from '@angular/core';
import { Editor } from '../interfaces/checklist.editor.interface';

type ChecklistState = {
  checklist: Editor.ChecklistTemplate | null;
  loading: boolean;
  error: string | null;
};

const initialState: ChecklistState = {
  checklist: null,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class ChecklistEditorStore {
  private state = signal<ChecklistState>(initialState);
  
  // Selectors
  checklist = this.state.asReadonly();
  
  // Actions
  setLoading(loading: boolean) {
    this.state.update(current => ({
      ...current,
      loading,
      error: loading ? null : current.error
    }));
  }

  setError(error: string) {
    this.state.update(current => ({
      ...current,
      loading: false,
      error
    }));
  }

  loadChecklist(checklist: Editor.ChecklistTemplate) {
    this.state.update(current => ({
      ...current,
      checklist,
      loading: false,
      error: null
    }));
  }

  updateChecklist(updates: Partial<Editor.ChecklistTemplate>) {
    if (!this.state().checklist) return;
    
    this.state.update(current => ({
      ...current,
      checklist: {
        ...current.checklist!,
        ...updates,
        metadata: {
          ...current.checklist!.metadata,
          lastUpdated: new Date().toISOString()
        }
      }
    }));
  }

  // Section operations
  addSection(section: Editor.Section) {
    if (!this.state().checklist) return;
    
    this.state.update(current => ({
      ...current,
      checklist: {
        ...current.checklist!,
        sections: [...(current.checklist?.sections || []), section]
      }
    }));
  }

  updateSection(sectionId: string, updates: Partial<Editor.Section>) {
    if (!this.state().checklist) return;

    this.state.update(current => {
      const sections = current.checklist?.sections?.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      ) || [];

      return {
        ...current,
        checklist: {
          ...current.checklist!,
          sections
        }
      };
    });
  }

  // Add more CRUD operations for subsections, categories, questions as needed
  // ...
}
