import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { FilesApiClient } from "@features/files/api-client/files-api-client";
import { useFile } from "@features/files/hooks/use-files";
import { Files } from "@features/files/types/types";
import { bytesFormat, centerEllipsis } from "@features/utils/format/strings";
import {
  getFileTypeIconProps,
  initializeFileTypeIcons,
} from "@fluentui/react-file-type-icons";
import { Icon } from "@fluentui/react/lib/Icon";
import { DownloadIcon, EyeIcon, XIcon } from "@heroicons/react/outline";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { twMerge } from "tailwind-merge";

initializeFileTypeIcons();

type FileTagType = {
  onDelete?: () => void;
  size: "lg" | "md" | "sm";
  progress?: number;
  id?: string;
  file?: Files;
  dataTooltip?: string;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export const RestFileTag = ({
  size,
  id,
  file,
  ...props
}: FileTagType & { id: string }) => {
  if (file) {
    return <FileTagRender {...props} size={size || "md"} file={file} />;
  }
  return <FileTagServer {...props} size={size || "md"} id={id} />;
};

const FileTagRender = ({
  size,
  file,
  icon,
  dataTooltip,
  className,
  progress,
  ...props
}: FileTagType) => {
  const name = file?.name || "-";
  const thumb = file?.has_thumbnail
    ? FilesApiClient.getThumbnailUrl(file)
    : undefined;
  dataTooltip =
    dataTooltip || (file ? `${name} - ${bytesFormat(file?.size)}` : "");

  return (
    <Tag
      icon={
        icon ? (
          icon
        ) : (
          <Icon
            className="mr-2"
            {...getFileTypeIconProps({ extension: name.split(".").pop() })}
          />
        )
      }
      size={size}
      noColor
      className={twMerge(
        className,
        "bg-white dark:bg-slate-900",
        !!(file?.id || progress !== undefined) && "pr-1",
        progress !== undefined && "opacity-75 animate-pulse"
      )}
      data-tooltip={dataTooltip}
      {...props}
    >
      <span className="flex items-center">
        {thumb && (
          <span className="w-7 h-7 flex items-center justify-center mr-1">
            <img
              src={thumb}
              className="object-contain border border-wood-200 dark:border-wood-800 rounded-sm"
              alt={name}
            />
          </span>
        )}
        <span>{centerEllipsis(name)}</span>
        {file?.id && progress === undefined && (
          <div className="group/file ml-1 flex items-center">
            <Button
              data-tooltip="Télécharger"
              theme="invisible"
              className="inline-block"
              size="sm"
              icon={(p) => <EyeIcon {...p} />}
              to={FilesApiClient.getDownloadUrl(file, true)}
              target="_blank"
            />
            {!props.onDelete && (
              <Button
                data-tooltip="Télécharger"
                theme="invisible"
                className="inline-block"
                size="sm"
                icon={(p) => <DownloadIcon {...p} />}
                to={FilesApiClient.getDownloadUrl(file)}
                target="_blank"
              />
            )}
            {props.onDelete && (
              <Button
                data-tooltip="Supprimer"
                theme="invisible"
                className="inline-block"
                size="sm"
                icon={() => <XIcon className="h-4 w-4 text-red-500" />}
                onClick={props.onDelete}
              />
            )}
          </div>
        )}
        {progress !== undefined && (
          <div className="h-4 w-4 ml-3 mr-1">
            <CircularProgressbar
              value={progress}
              strokeWidth={12}
              className="mr-1"
              styles={{
                path: {
                  stroke: "#aa8a65",
                },
                trail: {
                  stroke: "#88888844",
                },
              }}
            />
          </div>
        )}
      </span>
    </Tag>
  );
};

const FileTagServer = ({
  size,
  id,
  ...props
}: FileTagType & { id: string }) => {
  const { file } = useFile(id);
  return <FileTagRender size={size} file={file || undefined} {...props} />;
};
