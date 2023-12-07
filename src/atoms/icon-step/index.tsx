import { Transition } from "@headlessui/react";
import _ from "lodash";
import { useEffect, useState } from "react";
import { Subtitle } from "../text";

type IconStepProps = {
  children?: React.ReactNode;
  icon: string | React.ReactNode;
  className?: string;
};

export default function IconStep(props: IconStepProps) {
  const [isRefreshed, setIsRefreshed] = useState(true);

  useEffect(() => {
    setIsRefreshed(false);
    setTimeout(() => {
      setIsRefreshed(true);
    }, 100);
  }, [props.icon]);

  return (
    <div className={"flex " + (props.className || "")}>
      <div className="w-8">
        <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-full p-1 inline-block">
          <div className=" w-6 h-6">
            <Transition
              show={isRefreshed}
              as="div"
              enter="transform transition duration-[50ms]"
              enterFrom="opacity-0 rotate-[-120deg] scale-50"
              enterTo="opacity-100 rotate-0 scale-100"
              leave="transform duration-[0ms] transition ease-in-out"
              leaveFrom="opacity-100 rotate-0 scale-100 "
              leaveTo="opacity-0 scale-95 "
            >
              {!!isRefreshed && (
                <>
                  {_.isString(props.icon) ? (
                    <div className="text-blue-400 font-semibold m-auto text-center mt-1">
                      {props.icon}
                    </div>
                  ) : (
                    props.icon
                  )}
                </>
              )}
            </Transition>
          </div>
        </div>
      </div>
      <Subtitle className="grow ml-3 pt-1">{props.children}</Subtitle>
    </div>
  );
}
