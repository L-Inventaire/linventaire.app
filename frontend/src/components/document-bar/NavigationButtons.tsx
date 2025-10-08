import { Button } from "@atoms/button/button";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { getRoute } from "@features/routes";
import { DocumentBarNav } from "./nav";

interface NavigationButtonsProps {
  isModal: boolean;
  mode: "read" | "write";
  entity: string;
  document: any;
  onClose?: () => void;
  onCancel: () => void;
  viewRoute?: string;
}

export const NavigationButtons = ({
  isModal,
  mode,
  entity,
  document,
  onClose,
  onCancel,
  viewRoute,
}: NavigationButtonsProps) => {
  return (
    <div className="flex items-center space-x-1">
      {/* Back/Close button */}
      {(!isModal || !onClose) && (
        <Button
          data-tooltip="Retour"
          size="xs"
          theme={onClose ? "invisible" : "outlined"}
          shortcut={["esc"]}
          icon={
            onClose
              ? (p) => <XMarkIcon {...p} />
              : (p) => <ArrowLeftIcon {...p} />
          }
          onClick={onCancel}
        />
      )}

      {/* Document navigation (prev/next) */}
      {mode === "read" && !isModal && (
        <DocumentBarNav
          entity={entity}
          id={document?.id}
          getRoute={(id: string) => {
            return getRoute(viewRoute || "/", { id });
          }}
        />
      )}
    </div>
  );
};
