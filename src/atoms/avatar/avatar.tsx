import { Info } from "@atoms/text";
import { getServerUri, stringToColor } from "@features/utils/format/strings";
import _ from "lodash";
import { twMerge } from "tailwind-merge";

export const getColor = stringToColor;

export default function Avatar(props: {
  shape?: "square" | "circle";
  fallback?: string;
  avatar?: string | null;
  size: 4 | 5 | 8 | 10 | 11 | 28 | 14 | 48;
  className?: string;
}) {
  const size = props.size || 14;
  const className = twMerge(
    " inline-block h-" +
      size +
      " w-" +
      size +
      (props.shape === "square"
        ? size < 8
          ? " rounded-md "
          : " rounded-lg "
        : " rounded-full ") +
      " overflow-hidden bg-slate-200 ",
    props.className
  );

  if (props.avatar) {
    return (
      <div
        className={className}
        {..._.omit(props, "avatar", "className", "src")}
        style={{
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundImage: "url(" + getServerUri(props.avatar) + ")",
        }}
      />
    );
  }

  if (props.fallback) {
    const fallback = props.fallback
      .split(" ")
      .filter((a: string) => a.trim())
      .map((a: string) => a[0].toUpperCase())
      .slice(0, 2)
      .join("");
    return (
      <span
        className={
          className +
          " flex items-center justify-center text-white background-cover "
        }
        style={{ backgroundColor: `${getColor(fallback)}` }}
        {..._.omit(props, "avatar", "className", "src")}
      >
        <Info
          noColor
          className={
            "text-white " +
            (size < 8
              ? "text-xxs"
              : size < 14
              ? "text-sm"
              : size < 28
              ? "text-base"
              : "text-lg")
          }
        >
          {fallback}
        </Info>
      </span>
    );
  }

  return (
    <span
      className={className}
      {..._.omit(props, "avatar", "className", "src")}
    >
      <svg
        className="h-full w-full text-slate-400 bg-slate-200"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
  );
}
