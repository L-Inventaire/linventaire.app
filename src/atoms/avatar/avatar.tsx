import { Info } from "@atoms/text";
import _ from "lodash";
import seedrandom from "seedrandom";

export const getColor = (name: string) => {
  const seed = Math.floor(seedrandom(name)() * 100000000) % 360;
  return "hsl(" + seed + ", 80%, 40%)";
};

export default function Avatar(
  props: any & {
    shape?: "square" | "circle";
    fallback?: string;
    avatar: string;
    size: 5 | 28 | 14 | 48;
  }
) {
  const size = props.size || 14;
  const className =
    " inline-block h-" +
    size +
    " w-" +
    size +
    (props.shape === "square" ? " rounded-lg " : " rounded-full ") +
    " overflow-hidden bg-wood-200 " +
    (props.className || "");

  if (props.avatar || props.src) {
    return (
      <div
        className={className}
        {..._.omit(props, "avatar", "className", "src")}
        style={{
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundImage: "url(" + (props.avatar || props.src) + ")",
        }}
      />
    );
  }

  if (props.fallback) {
    return (
      <span
        className={
          className +
          " flex items-center justify-center text-white background-cover "
        }
        style={{ backgroundColor: `${getColor(props.fallback)}` }}
        {..._.omit(props, "avatar", "className", "src")}
      >
        <Info
          noColor
          className={
            size < 8
              ? "text-xxs"
              : size < 14
              ? "text-sm"
              : size < 28
              ? "text-base"
              : "text-lg"
          }
        >
          {props.fallback
            .split(" ")
            .filter((a: string) => a.trim())
            .map((a: string) => a[0].toUpperCase())
            .slice(0, 2)
            .join("")}
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
        className="h-full w-full text-wood-400 bg-wood-200"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </span>
  );
}
