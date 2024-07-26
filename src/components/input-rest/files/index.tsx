import { Button } from "@atoms/button/button";
import { InputOutlinedDefault } from "@atoms/styles/inputs";
import { Info } from "@atoms/text";
import { FormControllerType } from "@components/form/formcontext";
import { RestFileTag } from "@components/input-rest/files/file";
import { useClients } from "@features/clients/state/use-clients";
import { FilesApiClient } from "@features/files/api-client/files-api-client";
import { useFiles } from "@features/files/hooks/use-files";
import { Files } from "@features/files/types/types";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

export const FilesInput = (props: {
  value?: string[];
  onChange?: (value: string[]) => void;
  ctrl?: FormControllerType<string[]>;
  className?: string;
  size?: "md" | "sm";
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  refUploadTrigger?: (c: () => void) => void;
  rel?: {
    table: string;
    id: string;
    field: string;
  };
}) => {
  const value = props.ctrl?.value || props.value || [];
  const onChange = props.ctrl?.onChange || props.onChange;
  const size = props.size || "md";
  const { client } = useClients();
  const { files } = useFiles({
    query: [
      {
        key: "id",
        values: (value || []).map((a) => ({
          op: "equals",
          value: a.split("files:").pop(),
        })),
      },
    ],
    key: JSON.stringify(props.rel),
    limit: value.length,
  });
  const existingFiles = (files?.data?.list || [])?.slice(0, value?.length);

  const [loading, setLoading] = useState(false);
  const newFilesRef = useRef<
    { progress: number; entity?: Files; file: File }[]
  >([]);
  const [newFiles, setNewFiles] = useState<
    { progress: number; entity?: Files; file: File }[]
  >([]);

  const uploadFiles = async (f: File[]) => {
    setLoading(true);
    await Promise.all(
      f.map(async (file) => {
        const index = newFilesRef.current.length;
        newFilesRef.current.push({ progress: 0, file });
        setNewFiles([...newFilesRef.current]);

        try {
          const entity = await FilesApiClient.upload(
            client?.client_id || "",
            {
              name: file.name,
              size: file.size,
              mime: file.type,

              rel_table: props.rel?.table || "",
              rel_field: props.rel?.field || "",

              // File starts unreferenced until we save the entity
              // When saved, the file gets referenced by a trigger in backend (detects file:ididid pattern in the entity)
              rel_id: "",
              rel_unreferenced: true,
            },
            file,
            (progress) => {
              newFilesRef.current[index].progress = progress;
              setNewFiles([...newFilesRef.current]);
            }
          );

          newFilesRef.current[index].progress = 1;
          newFilesRef.current[index].entity = entity;
          setNewFiles([...newFilesRef.current]);
        } catch (e) {
          toast.error("Failed to upload file");
          newFilesRef.current[index].progress = -1;
        }
      })
    );
    setNewFiles([]);
    onChange?.([
      ...value,
      ...(newFilesRef.current || [])
        .filter((a) => a.entity?.id)
        .map((a) => `files:${a.entity?.id}`),
    ]);
    newFilesRef.current = [];
    setLoading(false);
  };

  return (
    <div
      className={twMerge(
        props.className,
        (existingFiles?.length || !props.disabled) && "-m-1",
        "relative"
      )}
    >
      <div className="w-full">
        {_.sortBy(existingFiles || [], "created_at").map((file) => (
          <RestFileTag
            key={file.id}
            className="m-1"
            id={file.id}
            size={"md"}
            onDelete={
              props.disabled
                ? undefined
                : () =>
                    onChange?.(value.filter((a) => a !== `files:${file.id}`))
            }
            file={file}
          />
        ))}
        {(newFiles || [])
          .filter((file) => file.progress >= 0)
          .map((file, i) => (
            <RestFileTag
              key={i}
              className="m-1"
              id={file.entity?.id || ""}
              size={"md"}
              progress={file.entity ? undefined : 100 * file.progress}
              file={
                file.entity ||
                ({
                  id: "",
                  mime: file.file.type,
                  name: file.file.name,
                  size: file.file.size,
                } as Files)
              }
            />
          ))}
      </div>
      {!props.disabled &&
        (props.max || 100) >
          (existingFiles || []).length + (newFiles || []).length && (
          <DroppableFilesInput
            disabled={loading}
            onChange={uploadFiles}
            size={size}
            refUploadTrigger={props.refUploadTrigger}
          />
        )}
    </div>
  );
};

export const DroppableFilesInput = ({
  onChange,
  className,
  disabled,
  size,
  refUploadTrigger,
}: {
  onChange: (f: File[]) => void;
  className?: string;
  disabled?: boolean;
  size?: "md" | "sm";
  refUploadTrigger?: (c: () => void) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overrideEventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const input = (
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      multiple
      onChange={(e) => {
        if (e.target.files && e.target.files.length && !disabled) {
          onChange(Array.from(e.target.files).slice(0, 10));
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }}
    />
  );

  useEffect(() => {
    refUploadTrigger?.(() => {
      fileInputRef.current?.click?.();
    });
  }, [refUploadTrigger]);

  if (refUploadTrigger) {
    return input;
  }

  return (
    <div
      className={twMerge(
        size === "md" && "w-full relative p-1",
        size === "sm" && "inline-block"
      )}
    >
      <div
        className={twMerge(
          InputOutlinedDefault,
          size === "md" &&
            "cursor-pointer text-center p-2 border-dashed border-2",
          className
        )}
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const files = e.dataTransfer?.files;
          if (files && files.length && !disabled) {
            onChange(Array.from(files).slice(0, 10));
          }
        }}
        onDragEnter={overrideEventDefaults}
        onDragLeave={overrideEventDefaults}
        onDragOver={overrideEventDefaults}
      >
        {size === "md" && (
          <Info className="grow flex items-center justify-center h-full">
            <PaperClipIcon className="h-4 w-4 inline-block mr-2" />
            <span>Click or drop to add files</span>
          </Info>
        )}
        {size !== "md" && (
          <Button
            size={size}
            theme="invisible"
            icon={(p) => <PaperClipIcon {...p} />}
          />
        )}
        {input}
      </div>
    </div>
  );
};
