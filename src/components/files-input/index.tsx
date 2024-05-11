import { Info } from "@atoms/text";
import { RestFileTag } from "@components/rest-tags/components/file";
import { useClients } from "@features/clients/state/use-clients";
import { FilesApiClient } from "@features/files/api-client/files-api-client";
import { useFiles } from "@features/files/hooks/use-files";
import { Files } from "@features/files/types/types";
import _ from "lodash";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

export const FilesInput = (props: {
  value: string[];
  className?: string;
  size?: "sm" | "md";
  max?: number;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  rel?: {
    table: string;
    id: string;
    field: string;
  };
}) => {
  const { client } = useClients();
  const { files } = useFiles({
    query: [
      {
        key: "id",
        values: (props.value || []).map((a) => ({
          op: "equals",
          value: a.split("files:").pop(),
        })),
      },
    ],
    key: JSON.stringify(props.rel),
    limit: props.value.length || 1,
  });
  const existingFiles = (files?.data?.list || [])?.slice(
    0,
    props.value?.length
  );

  const [loading, setLoading] = useState(false);
  const newFilesRef = useRef<
    { progress: number; entity?: Files; file: File }[]
  >([]);
  const [newFiles, setNewFiles] = useState<
    { progress: number; entity?: Files; file: File }[]
  >([]);

  return (
    <div
      className={twMerge(
        props.className,
        (existingFiles?.length || !props.disabled) && "-m-1",
        "relative"
      )}
    >
      <div className="w-full">
        {props.value.length === 0 && props.disabled && (
          <Info>Aucun document</Info>
        )}
        {_.sortBy(existingFiles || [], "created_at").map((file) => (
          <RestFileTag
            className="m-1"
            id={file.id}
            size={"lg"}
            onDelete={
              props.disabled
                ? undefined
                : () =>
                    props.onChange?.(
                      props.value.filter((a) => a !== `files:${file.id}`)
                    )
            }
            file={file}
          />
        ))}
        {(newFiles || [])
          .filter((file) => file.progress >= 0)
          .map((file) => (
            <RestFileTag
              className="m-1"
              id={file.entity?.id || ""}
              size={"lg"}
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
      {!props.disabled && (
        <div className="w-full relative p-1">
          <DroppableFilesInput
            disabled={loading}
            onChange={async (f) => {
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
              props.onChange?.([
                ...props.value,
                ...(newFilesRef.current || [])
                  .filter((a) => a.entity?.id)
                  .map((a) => `files:${a.entity?.id}`),
              ]);
              newFilesRef.current = [];
              setLoading(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export const DroppableFilesInput = ({
  onChange,
  className,
  disabled,
}: {
  onChange: (f: File[]) => void;
  className?: string;
  disabled?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overrideEventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div
      className={twMerge(
        "cursor-pointer text-center p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded w-full hover:bg-wood-50 dark:hover:bg-wood-950",
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
      <Info>Click or drop to add files</Info>
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
    </div>
  );
};
