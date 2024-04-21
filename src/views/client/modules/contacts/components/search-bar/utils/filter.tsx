import { twMerge } from "tailwind-merge";
import { MatchedStringFilter, SearchField } from "./types";
import { labelToVariable } from "./utils";
import reactStringReplace from "react-string-replace";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/outline";

export const buildFilter = (
  fields: SearchField[],
  filter: MatchedStringFilter
) => {
  const field = fields.find((a) => labelToVariable(a.label) === filter.key);
  if (!field && !filter.key) return <span>{filter.raw + " "}</span>;
  const fieldName = field?.label || filter.key;
  let type = field?.type;

  if (filter.values_raw) {
    // Text types must use quotes
    if (!filter.values_raw.match(/^~?"/) && type === "text") {
      type = undefined;
    }

    //Numbers should be of specific format age:>=20 age:<=30 age:20->30
    if (
      type === "number" &&
      !filter.values_raw.match(
        /^(((>=|<=)\d+(\.\d+)?|\d+(\.\d+)?->\d+(\.\d+)?|\d+(\.\d+)?),?)+$/
      )
    ) {
      type = undefined;
    }

    // Dates should be of specific format date:>=2024-04-07 date:<=2024-04-07 date:2024-04-07->2024-04-07
    // Or with time date:>=2024-04-07T12:00 date:<=2024-04-07T12:00 date:2024-04-07T12:00->2024-04-07T12:00
    if (
      type === "date" &&
      !filter.values_raw.match(
        /^(((>=|<=)\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2})?|\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2})?|\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2})?->\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2})?),?)+$/
      )
    ) {
      type = undefined;
    }

    // Booleans should be of specific format boolean:0 boolean:1
    if (type === "boolean" && !filter.values_raw.match(/^((1|0),?)+$/i)) {
      type = undefined;
    }
  }

  if (!type) {
    return (
      <span
        className={twMerge(
          "bg-wood-500 bg-opacity-10 border border-wood-500 rounded-sm",
          "bg-red-500 text-red-500 border-red-500 line-through"
        )}
        style={{
          marginLeft: "-0.4ch",
          marginRight: "0.6ch",
          padding: "0 calc(0.4ch - 1px)",
        }}
      >
        <span className="font-bold">
          {filter.not && "!"}
          {fieldName}
          {":"}
        </span>
        <span>{filter.values_raw}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        marginLeft: "-0.4ch",
        marginRight: "0.6ch",
      }}
    >
      <span
        className={twMerge(
          "bg-wood-500 text-wood-500 text-white border border-wood-500 rounded border-r-0 rounded-r-none"
        )}
        style={{
          padding: "1px 0",
        }}
      >
        {filter.not && (
          <span
            className="bg-red-500"
            style={{
              padding: "1px 0",
            }}
          >
            !
          </span>
        )}
        <span
          style={{
            padding: "1px calc(0.4ch - 1px)",
          }}
        >
          {fieldName}
        </span>
      </span>
      <span
        className={twMerge(
          "relative bg-wood-500 bg-opacity-10 border border-wood-500 rounded rounded-l-none"
        )}
        style={{
          padding: "1px calc(0.5ch - 1px)",
          paddingLeft: "0.5ch",
        }}
      >
        {type !== "text" &&
          filter.values_raw &&
          filter.values_raw.split(",").map((value, i) => (
            <span
              className={
                i < filter.values_raw.split(",").length - 1
                  ? "border-r border-wood-500"
                  : ""
              }
              style={{
                padding: "1px 0",
                paddingLeft: i === 0 ? "0" : "calc(0.5ch)",
                paddingRight:
                  i === filter.values_raw.split(",").length - 1
                    ? "0"
                    : "calc(0.5ch)",
              }}
            >
              {type?.indexOf("type:") === 0 && <span>{value}</span>}
              {type?.indexOf("type:") !== 0 &&
                type !== "boolean" &&
                reactStringReplace(value, /(->|<=|>=|T)/, (match) => (
                  <span
                    style={{ width: match.length + "ch" }}
                    className="inline-block text-center"
                  >
                    <span className="font-sans text-xs text-wood-500 -top-px relative">
                      {match.replace(/T/, "")}
                    </span>
                  </span>
                ))}
              {type?.indexOf("type:") !== 0 && type === "boolean" && value && (
                <span
                  style={{ width: value.length + "ch" }}
                  className={twMerge(
                    "inline-block text-center",
                    value === "1" ? "text-wood-500" : "text-red-500"
                  )}
                >
                  {" "}
                  {value === "1" ? (
                    <CheckCircleIcon className="h-4 w-4 absolute top-0 left-0 right-0 bottom-0 m-auto" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 absolute top-0 left-0 right-0 bottom-0 m-auto" />
                  )}
                </span>
              )}
            </span>
          ))}
        {type === "text" && <span>{filter.values_raw}</span>}
      </span>
    </span>
  );
};
