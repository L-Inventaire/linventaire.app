import { Button } from "@atoms/button/button";
import { getRoute } from "@features/routes";
import { formatTime } from "@features/utils/format/dates";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@radix-ui/themes";
import toast from "react-hot-toast";

interface StatusBadgesProps {
  isRevision: boolean;
  revision?: string;
  isDeleted: boolean;
  document: any;
  viewRoute?: string;
  onRestore?: () => Promise<void>;
  onChangeMode?: (mode: "write" | "read") => void;
  isModal?: boolean;
}

/**
 * StatusBadges Component
 *
 * Displays status information and restoration controls for special document states:
 * - Revision: Shows version timestamp with restore and return-to-latest options
 * - Deleted: Shows deletion status with restore option
 * - Normal: Renders nothing (no special status to display)
 */
export const StatusBadges = ({
  isRevision,
  revision,
  isDeleted,
  document,
  viewRoute,
  onRestore,
  onChangeMode,
  isModal,
}: StatusBadgesProps) => {
  const navigate = useNavigateAlt();

  if (isRevision) {
    return (
      <>
        <Badge color="bronze" size="2">
          Vous consultez une version antérieure (
          {revision ? formatTime(revision) : ""})
        </Badge>
        {onRestore && (
          <Button
            color="green"
            data-tooltip="Restaurer cette version"
            size="xs"
            theme="invisible"
            icon={(p) => <ArchiveBoxArrowDownIcon {...p} />}
            onClick={async () => {
              try {
                await onRestore();
                if (isModal) {
                  onChangeMode?.("read");
                } else {
                  navigate(
                    getRoute(viewRoute || "/", {
                      id: document.id.split("~")[0],
                    })
                  );
                }
              } catch {
                toast.error("Impossible de restaurer le document");
              }
            }}
          />
        )}
        {viewRoute && (
          <Button
            color="green"
            data-tooltip="Revenir à la dernière version"
            size="xs"
            theme="invisible"
            icon={(p) => <ArrowUturnLeftIcon {...p} />}
            onClick={() => {
              navigate(
                getRoute(viewRoute, {
                  id: document.id.split("~")[0],
                })
              );
            }}
          />
        )}
      </>
    );
  }

  if (isDeleted) {
    return (
      <>
        <Badge color="red" size="2">
          Document supprimé
        </Badge>
        {onRestore && (
          <Button
            data-tooltip="Restaurer"
            size="xs"
            theme="invisible"
            icon={(p) => <ArchiveBoxArrowDownIcon {...p} />}
            onClick={async () => {
              try {
                await onRestore();
                if (isModal) {
                  onChangeMode?.("read");
                } else {
                  navigate(
                    getRoute(viewRoute || "/", {
                      id: document.id.split("~")[0],
                    })
                  );
                }
              } catch {
                toast.error("Impossible de restaurer le document");
              }
            }}
          />
        )}
      </>
    );
  }

  return null;
};
