import { Button } from "@atoms/button/button";
import { getRoute } from "@features/routes";
import { RestEntity } from "@features/utils/rest/types/types";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import {
  ClockIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  PencilSquareIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export const DocumentBar = ({
  mode,
  document,
  onSave,
  prefix,
  suffix,
  ...props
}: {
  mode: "read" | "write";
  document: any & RestEntity;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  backRoute?: string;
  viewRoute?: string;
  editRoute?: string;
  onSave?: () => Promise<void>;
}) => {
  const navigate = useNavigate();

  const cancel = async () => {
    navigate(
      !document.id || mode === "read"
        ? getRoute(props.backRoute || "/")
        : getRoute(props.viewRoute || "/", { id: document.id })
    );
  };

  return (
    <div className="items-center flex grow space-x-2 px-3 text-base">
      <div className="flex items-center space-x-1">
        <Button
          data-tooltip="Retour"
          size="xs"
          theme="outlined"
          shortcut={["esc"]}
          icon={(p) => <ArrowLeftIcon {...p} />}
          onClick={cancel}
        />
        {mode === "read" && (
          <>
            <Button
              data-tooltip="Précédent"
              size="xs"
              theme="outlined"
              shortcut={["k"]}
              icon={(p) => <ChevronUpIcon {...p} />}
            />
            <Button
              data-tooltip="Suivant"
              size="xs"
              theme="outlined"
              shortcut={["j"]}
              icon={(p) => <ChevronDownIcon {...p} />}
            />
          </>
        )}
      </div>
      {mode === "read" && (
        <Button
          data-tooltip="Modifier"
          size="xs"
          theme="outlined"
          shortcut={["e"]}
          onClick={async () =>
            navigate(getRoute(props.editRoute || "", { id: document.id }))
          }
        >
          Modifier
        </Button>
      )}
      {prefix}
      <div className="grow" />
      <Button
        size="xs"
        theme="invisible"
        icon={(p) => <DocumentDuplicateIcon {...p} />}
      />
      <Button size="xs" theme="invisible" icon={(p) => <LinkIcon {...p} />} />
      <Button
        size="xs"
        theme="invisible"
        icon={(p) => <PrinterIcon {...p} />}
      />
      <Button size="xs" theme="invisible" icon={(p) => <ClockIcon {...p} />} />
      <Button
        size="xs"
        theme="invisible"
        icon={(p) => <EllipsisHorizontalIcon {...p} />}
      />
      {mode === "write" && (
        <>
          <Button size="xs" theme="outlined" onClick={cancel}>
            Annuler
          </Button>
          <Button size="xs" onClick={onSave} shortcut={["cmd+s"]}>
            Sauvegarder
          </Button>
        </>
      )}
      {suffix}
    </div>
  );
};
