import { useCallback, useContext, useEffect } from "react";
import { getRoute } from "@features/routes";
import { useLastLocations } from "@features/utils/hooks/use-navigation-history";
import { useNavigateAlt } from "@features/utils/navigate";
import { useRegisterActiveSelection } from "@features/ctrlk/use-register-current-selection";
import { DraftContext } from "../../features/utils/rest/hooks/use-draft-rest";
import _ from "lodash";

/**
 * Custom hook to handle complex cancel/back navigation logic
 *
 * Implements the different navigation behaviors based on context:
 * - Modal mode: calls onClose callback
 * - Edit mode with existing document: navigates to view page
 * - Other cases: navigates to previous page or fallback route
 *
 * Intelligently filters navigation history to avoid bouncing between
 * view/edit pages of the same document.
 *
 * @param document - The current document
 * @param mode - Current mode ("read" or "write")
 * @param onClose - Optional callback for modal close
 * @param routes - Route patterns for navigation
 * @returns Object with cancel function and modal state
 */
export const useCancelNavigation = (
  document: any,
  mode: "read" | "write",
  onClose?: () => void,
  routes?: {
    viewRoute?: string;
    editRoute?: string;
    backRoute?: string;
  }
) => {
  const { isModal } = useContext(DraftContext);
  const navigate = useNavigateAlt();
  const { getLastLocations } = useLastLocations();

  const cancel = useCallback(async () => {
    // Modal mode: just close the modal
    if (onClose) return onClose();

    // Find the most recent page that isn't a view/edit page for this document
    // This prevents infinite loops when navigating between view and edit modes
    const previousPage = _.last(
      getLastLocations().filter(
        (location) =>
          !(
            routes?.viewRoute &&
            (location.includes(
              getRoute(routes.viewRoute, { id: document.id })
            ) ||
              location.includes(getRoute(routes.viewRoute, { id: "new" })))
          ) &&
          !(
            routes?.editRoute &&
            (location.includes(
              getRoute(routes.editRoute, { id: document.id })
            ) ||
              location.includes(getRoute(routes.editRoute, { id: "new" })))
          )
      )
    );

    // If we're editing an existing document, go to its view page
    // Otherwise, go to the previous page or fallback route
    const backToView = document.id && mode !== "read";
    navigate(
      backToView
        ? getRoute(routes?.viewRoute || "/", { id: document.id })
        : previousPage || getRoute(routes?.backRoute || "/")
    );
  }, [
    document,
    mode,
    navigate,
    onClose,
    routes?.backRoute,
    routes?.editRoute,
    routes?.viewRoute,
    getLastLocations,
  ]);

  return { cancel, isModal };
};

/**
 * Custom hook to register current document for global search (Ctrl+K)
 *
 * Registers the document with a slight delay to ensure the component
 * is fully mounted, then automatically unregisters on cleanup.
 *
 * @param entity - The entity type for categorization
 * @param document - The document to register
 */
export const useDocumentSelection = (entity: string, document: any) => {
  const { register, unregister } = useRegisterActiveSelection();

  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      register(entity, [document]);
    }, 100);

    return () => {
      clearTimeout(timer);
      unregister();
    };
  }, []);
};
