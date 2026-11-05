import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from './types';

interface WorkspaceStoreState {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (ws: Workspace | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
    }),
    {
      name: 'insight-hub-workspace',
    }
  )
);
