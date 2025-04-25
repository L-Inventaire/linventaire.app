import { twMerge } from "tailwind-merge";

export const Dot = ({ className }: { className?: string }) => {
  return (
    <div
      className={twMerge(
        "inline-block bg-orange-400 rounded-full h-2 w-2",
        className || ""
      )}
    />
  );
};
