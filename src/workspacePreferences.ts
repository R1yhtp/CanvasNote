export type ToolbarPosition = 'bottom' | 'left' | 'right';

export interface WorkspacePreferences {
  toolbarPosition: ToolbarPosition;
  toolbarCollapsed: boolean;
}

export const defaultWorkspacePreferences: WorkspacePreferences = {
  toolbarPosition: 'bottom',
  toolbarCollapsed: false,
};

export function normalizeWorkspacePreferences(value: unknown): WorkspacePreferences {
  const data = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<WorkspacePreferences>
    : {};
  return {
    toolbarPosition: ['bottom', 'left', 'right'].includes(data.toolbarPosition || '')
      ? data.toolbarPosition as ToolbarPosition
      : 'bottom',
    toolbarCollapsed: data.toolbarCollapsed === true,
  };
}
