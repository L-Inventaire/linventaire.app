import { useEffect, useRef, useState } from "react";
import { defaultInputClassName } from "./input-text";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onComplete?: (code: string) => void;
  loading?: boolean;
}

export default function InputCode(props: InputProps) {
  const [code, _setCode] = useState("");
  const refs: { [key: string]: any } = {
    1: useRef(),
    2: useRef(),
    3: useRef(),
    4: useRef(),
    5: useRef(),
    6: useRef(),
  };

  const setCode = (code: string) => {
    _setCode(code.replace(/[^0-9]/g, ""));
  };

  useEffect(() => {
    if (code.length >= Object.keys(refs).length) {
      setCode(code.slice(0, Object.keys(refs).length));
      Object.values(refs).forEach((e) => e?.current.blur());
      props.onComplete && props.onComplete(code);
    } else {
      refs[code.length + 1]?.current.focus();
    }
  }, [code]);

  return (
    <div
      className={
        "w-full text-center flex justify-center " +
        (props.loading ? " pointer-events-none animate-pulse " : "")
      }
    >
      <div
        className="flex -space-x-px shadow-md rounded-lg"
        style={{ maxWidth: 300 }}
      >
        <span
          style={{ fontSize: "1.1rem" }}
          className="h-12 font-semibold inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-100 bg-gray-50 text-gray-500 sm:text-sm"
        >
          MW-
        </span>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <input
            key={i}
            ref={refs[i]}
            type="number"
            style={{ fontSize: "1.2rem" }}
            value={code[i - 1] || ""}
            onKeyDown={(e) => {
              //If backspace, remove last character
              if (e.key === "Backspace") {
                setCode(code.slice(0, -1));
              }
            }}
            onChange={(e) => {
              setCode(
                code.slice(0, i - 1) +
                  e.target.value +
                  code.slice(i, code.length)
              );
            }}
            onFocus={(e) => {
              e.target.select();
            }}
            className={
              defaultInputClassName +
              " focus:z-10 flex-1 min-w-0 rounded-none shadow-none text-center " +
              (i === 6 ? "rounded-r-lg" : "")
            }
            placeholder="•"
          />
        ))}
      </div>
    </div>
  );
}
