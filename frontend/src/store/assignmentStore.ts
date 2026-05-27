import { create } from 'zustand';
import { Assignment, CreateAssignmentForm, QuestionType } from '@/types';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AssignmentStore {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
  
  // Form state
  form: CreateAssignmentForm;
  setFormField: (key: keyof CreateAssignmentForm, value: any) => void;
  addQuestionType: () => void;
  updateQuestionType: (index: number, field: keyof QuestionType, value: any) => void;
  removeQuestionType: (index: number) => void;
  resetForm: () => void;

  // Actions
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<Assignment | null>;
  createAssignment: (data: FormData) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  updateAssignmentStatus: (id: string, update: Partial<Assignment>) => void;
}

const defaultForm: CreateAssignmentForm = {
  title: '',
  dueDate: '',
  questionTypes: [{ type: 'Multiple Choice Questions', count: 4, marks: 1 }],
  additionalInfo: '',
};

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,
  form: { ...defaultForm },

  setFormField: (key, value) =>
    set((state) => ({ form: { ...state.form, [key]: value } })),

  addQuestionType: () =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: [
          ...state.form.questionTypes,
          { type: 'Short Questions', count: 3, marks: 2 },
        ],
      },
    })),

  updateQuestionType: (index, field, value) =>
    set((state) => {
      const qt = [...state.form.questionTypes];
      qt[index] = { ...qt[index], [field]: value };
      return { form: { ...state.form, questionTypes: qt } };
    }),

  removeQuestionType: (index) =>
    set((state) => ({
      form: {
        ...state.form,
        questionTypes: state.form.questionTypes.filter((_, i) => i !== index),
      },
    })),

  resetForm: () => set({ form: { ...defaultForm } }),

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.get(`${API}/api/assignments`);
      set({ assignments: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAssignment: async (id) => {
    try {
      const { data } = await axios.get(`${API}/api/assignments/${id}`);
      set({ currentAssignment: data.data });
      return data.data;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  createAssignment: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API}/api/assignments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        assignments: [data.data, ...state.assignments],
        isLoading: false,
      }));
      return data.data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteAssignment: async (id) => {
    try {
      await axios.delete(`${API}/api/assignments/${id}`);
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  regenerateAssignment: async (id) => {
    try {
      await axios.post(`${API}/api/assignments/${id}/regenerate`);
      set((state) => ({
        assignments: state.assignments.map((a) =>
          a._id === id ? { ...a, status: 'processing' } : a
        ),
        currentAssignment:
          state.currentAssignment?._id === id
            ? { ...state.currentAssignment, status: 'processing' }
            : state.currentAssignment,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateAssignmentStatus: (id, update) => {
    set((state) => ({
      assignments: state.assignments.map((a) => (a._id === id ? { ...a, ...update } : a)),
      currentAssignment:
        state.currentAssignment?._id === id
          ? { ...state.currentAssignment, ...update }
          : state.currentAssignment,
    }));
  },
}));
