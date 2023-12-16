import { Base, Info } from "@atoms/text";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { useRef, useState } from "react";
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
    7: useRef(),
    8: useRef(),
  };

  const setCode = (code: string) => {
    _setCode(code.replace(/[^0-9]/g, ""));
  };

  useControlledEffect(() => {
    if (code.length >= Object.keys(refs).length) {
      const sliceCode = code.slice(0, 8);
      setCode(sliceCode);
      Object.values(refs).forEach((e) => e?.current.blur());
      props.onComplete && props.onComplete(sliceCode);
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
      <div className="flex -space-x-px shadow-sm rounded-lg">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <>
            <input
              key={i}
              ref={refs[i]}
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
                defaultInputClassName() +
                " h-11 pl-0 pr-0 focus:z-10 flex-1 min-w-0 rounded-none shadow-none text-center " +
                (i % 4 === 0 ? " rounded-r-md" : "") +
                (i % 4 === 1 ? " rounded-l-md" : "")
              }
              placeholder="•"
            />
            {i % 4 === 0 && i !== 8 && (
              <div className="px-2 flex items-center h-11 justify-center">
                <Info>-</Info>
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}
