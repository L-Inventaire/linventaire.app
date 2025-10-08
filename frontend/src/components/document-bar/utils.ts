import { entityToAccessLevel } from "@/features/access";
import { entityRoutes } from "@features/routes";
import { useHasAccess } from "@/features/access";
import { DocumentBarProps, DocumentState } from "./types";

/**
 * Analyzes a document to determine its current state and derived properties
 *
 * @param entity - The entity type (e.g., "invoices", "clients")
 * @param document - The document object to analyze
 * @returns DocumentState object with computed properties
 */
export const getDocumentState = (
  entity: string,
  document: any
): DocumentState => {
  // Revisions are identified by "~" in the ID (e.g., "123~1640995200000")
  const isRevision = document?.id?.includes("~");
  const revision = document?.id?.split("~")[1]; // Extract timestamp
  const isDeleted = document?.is_deleted;

  // Special handling for invoices which have subtypes for permissions
  const entityRoleName =
    entity === "invoices" ? `${entity}_${document?.type}` : entity;

  return {
    isRevision,
    revision,
    isDeleted,
    entityRoleName,
  };
};

/**
 * Resolves route patterns for an entity, using provided overrides or defaults
 *
 * @param entity - The entity type to get routes for
 * @param providedRoutes - Optional route overrides
 * @returns Object with resolved route patterns
 */
export const getDefaultRoutes = (
  entity: string,
  providedRoutes: Pick<DocumentBarProps, "editRoute" | "viewRoute">
) => {
  return {
    editRoute: providedRoutes.editRoute || entityRoutes[entity]?.edit,
    viewRoute: providedRoutes.viewRoute || entityRoutes[entity]?.view,
  };
};

/**
 * Hook to determine user access permissions for a specific entity
 *
 * @param entityRoleName - The role name to check permissions for
 * @returns Object with permission flags
 */
export const useDocumentAccess = (entityRoleName: string) => {
  const hasAccess = useHasAccess();

  return {
    hasManageAccess: hasAccess(entityToAccessLevel(entityRoleName, "MANAGE")),
    hasWriteAccess: hasAccess(entityToAccessLevel(entityRoleName, "WRITE")),
  };
};

/**
 * Prepares document data for duplication by removing fields that should be unique
 * or auto-generated for new documents
 *
 * @param document - The source document to duplicate
 * @returns Cleaned document data suitable for creating a new document
 */
export const getDuplicateDocumentData = (document: any) => {
  const excludedFields = [
    "id", // New document will get its own ID
    "state", // Reset to initial state
    "emit_date", // Set new emission date
    "reference_preferred_value", // Generate new reference
    "recipients", // Clear recipients for safety
  ];

  return Object.fromEntries(
    Object.entries(document).filter(([key]) => !excludedFields.includes(key))
  );
};
