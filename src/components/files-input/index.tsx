import { Info } from "@atoms/text";
import { RestFileTag } from "@components/rest-tags/components/file";
import { Files } from "@features/files/types/types";
import { useRef } from "react";
import { twMerge } from "tailwind-merge";

export const FilesInput = (props: {
  value: string[];
  className?: string;
  size?: "sm" | "md";
  max?: number;
  onChange?: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const selectedFiles = [1];

  return (
    <div
      className={twMerge(
        props.className,
        selectedFiles.length && "-m-1",
        "relative"
      )}
    >
      <div className="w-full">
        <RestFileTag
          className="m-1"
          id={"12"}
          size={"lg"}
          file={
            {
              id: "12",
              name: "Test.xlsx",
              size: 12545751,
            } as Files
          }
        />
        <RestFileTag
          className="m-1"
          id={"12"}
          size={"lg"}
          file={
            {
              id: "12",
              name: "Image with a long name.png",
              size: 12545751,
            } as Files
          }
        />
        <RestFileTag
          className="m-1"
          id={"12"}
          size={"lg"}
          progress={90}
          file={
            {
              id: "12",
              name: "Image with a long name.png",
              size: 12545751,
            } as Files
          }
        />
      </div>
      {!props.disabled && (
        <div className="w-full mt-1 relative p-1">
          <DroppableFilesInput onChange={(f) => console.log(f)} />
        </div>
      )}
    </div>
  );
};

export const DroppableFilesInput = ({
  onChange,
  className,
}: {
  onChange: (f: File[]) => void;
  className?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overrideEventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div
      className={twMerge(
        "cursor-pointer text-center p-4 border-2 border-dashed border-slate-100 rounded w-full hover:bg-wood-50",
        className
      )}
      onClick={() => fileInputRef.current?.click()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer?.files;
        if (files && files.length) {
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
        onChange={(e) => {
          if (e.target.files && e.target.files.length) {
            onChange(Array.from(e.target.files).slice(0, 10));
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      />
    </div>
  );
};
