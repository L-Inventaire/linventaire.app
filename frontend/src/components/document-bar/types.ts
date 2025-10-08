import { RestEntity } from "@features/utils/rest/types/types";

/**
 * Document bar modes determine the available actions and UI state
 */
export type DocumentBarMode = "read" | "write";

/**
 * Props for the DocumentBar component
 *
 * This component handles the complex user journeys described in the main component:
 * - Modal vs full-page navigation
 * - Create/Edit/View modes with proper navigation
 * - Document state management (deleted, revision, etc.)
 */
export interface DocumentBarProps {
  /** Loading state - hides most buttons when true */
  loading?: boolean;

  /** Current mode of the document bar */
  mode: DocumentBarMode;

  /** Entity type (e.g., "invoices", "clients") - used for permissions and routing */
  entity: string;

  /** The document being displayed/edited */
  document: any & RestEntity;

  /** Content to show on the left side (when document is not deleted/revision) */
  prefix?: React.ReactNode;

  /** Content to show on the right side (when document is not deleted/revision) */
  suffix?: React.ReactNode;

  /** When true, disables save actions due to validation errors */
  incomplete?: boolean;

  // Event handlers
  /** Called when modal should close (modal mode only) */
  onClose?: () => void;

  /** Called when print action is triggered (if not provided, print button is hidden) */
  onPrint?: () => Promise<void>;

  /** Called when save action is triggered */
  onSave?: () => Promise<any>;

  /** Called when delete action is triggered */
  onRemove?: () => Promise<void>;

  /** Called when restore action is triggered (for deleted documents or revisions) */
  onRestore?: () => Promise<void>;

  /** Called when switching between read/write modes */
  onChangeMode?: (mode: DocumentBarMode) => void;

  // Route overrides (optional - defaults come from entityRoutes)
  /** Route to navigate back to when canceling */
  backRoute?: string;

  /** Route pattern for viewing documents (e.g., "/invoices/:id") */
  viewRoute?: string;

  /** Route pattern for editing documents (e.g., "/invoices/:id/edit") */
  editRoute?: string;
}

/**
 * Internal state derived from document properties
 */
export interface DocumentState {
  /** True if viewing a historical revision (ID contains "~") */
  isRevision: boolean;

  /** Revision timestamp (if isRevision is true) */
  revision: string | undefined;

  /** True if document is soft-deleted */
  isDeleted: boolean;

  /** Entity role name for permission checks (handles special cases like invoice types) */
  entityRoleName: string;
}

/**
 * Route configuration for navigation
 */
export interface RouteConfig {
  editRoute?: string;
  viewRoute?: string;
  backRoute?: string;
}
