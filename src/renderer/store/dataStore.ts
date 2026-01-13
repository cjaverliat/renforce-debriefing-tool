// Zustand store for PLM data
import { create } from 'zustand';
import type { PLMData } from '../../shared/types/ipc';

interface DataState {
  plmData: PLMData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFile: (filePath: string) => Promise<void>;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  plmData: null,
  isLoading: false,
  error: null,

  loadFile: async (filePath: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await window.electronAPI.loadPLMFile(filePath);
      set({ plmData: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearData: () => set({ plmData: null, error: null }),
}));