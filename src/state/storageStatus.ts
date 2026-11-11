import { create } from 'zustand'

export type StorageIssue =
  { kind: 'corrupt' } | { kind: 'future-version'; version: number } | { kind: 'unavailable' }

interface StorageStatusState {
  issue: StorageIssue | null
  report: (issue: StorageIssue) => void
  dismiss: () => void
}

/**
 * Avisos de persistencia. Viven fuera del store del juego para poder
 * reportarse mientras Zustand hidrata, antes de que React monte la app.
 */
export const useStorageStatus = create<StorageStatusState>((set) => ({
  issue: null,

  report: (issue) =>
    set((state) => {
      if (state.issue?.kind === issue.kind) {
        if (
          issue.kind === 'future-version' &&
          state.issue.kind === 'future-version' &&
          state.issue.version !== issue.version
        ) {
          return { issue }
        }

        return state
      }

      return { issue }
    }),

  dismiss: () => set({ issue: null }),
}))

export function reportStorageIssue(issue: StorageIssue): void {
  useStorageStatus.getState().report(issue)
}
