import { Button } from "@atoms/button/button";
import { DropDownAtom } from "@atoms/dropdown";
import { useShortcutsContext } from "@features/utils/shortcuts";
import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { Heading } from "@radix-ui/themes";
import { ErrorBoundary } from "@views/error-boundary";
import _, { uniqueId } from "lodash";
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { atom, useRecoilState, useSetRecoilState } from "recoil";

const ModalsCountState = atom<string[]>({
  key: "ModalsState",
  default: [],
});

const visibleModals = { stack: [] as string[] };

let isClickingOutside = false;

export const ModalContext = (props: { level: string }) => {
  const setMenu = useSetRecoilState(DropDownAtom);
  useEffect(() => {
    setMenu({ target: null, menu: [] });
  }, []);
  useShortcutsContext("modal_" + props.level);
  return <></>;
};

export const Modal = (props: {
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  closable?: boolean;
  className?: string;
  style?: any;
  positioned?: boolean;
}) => {
  const modalId = useRef(uniqueId());
  const [open, setOpen] = useState(false);
  const [, setModalsCountState] = useRecoilState(ModalsCountState);
  const [level, setLevel] = useState(0);
  const openStatus = useRef<boolean>(false);

  const onClose = useCallback(() => {
    openStatus.current = false;
    visibleModals.stack = visibleModals.stack.filter(
      (a) => a !== modalId.current
    );
    setModalsCountState(visibleModals.stack);
  }, [setModalsCountState]);

  const onOpen = useCallback(() => {
    openStatus.current = true;
    visibleModals.stack = _.uniq([...visibleModals.stack, modalId.current]);
    setLevel(visibleModals.stack.findIndex((a) => a === modalId.current));
    setModalsCountState(visibleModals.stack);
  }, [setModalsCountState]);

  useEffect(() => {
    if (props.open !== open) {
      setOpen(props.open || false);
      if (props.open) {
        onOpen();
      } else {
        onClose();
      }
    }
  }, [props.open, open, onClose, onOpen]);

  useEffect(() => {
    return () => {
      if (openStatus.current) onClose();
    };
  }, [openStatus, onClose]);

  const zIndex = "z-[" + (level + 5) + "0]";

  return (
    <>
      {createPortal(
        <Transition.Root show={open} as={Fragment}>
          <div className={"relative " + zIndex}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 pointer-events-none"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0 pointer-events-none"
            >
              <div
                className={
                  "fixed inset-0 bg-opacity-10 dark:bg-opacity-80 transition-opacity bg-black"
                }
              />
            </Transition.Child>

            <div
              onMouseDown={() => {
                isClickingOutside = true;
              }}
              onClick={() => {
                if (isClickingOutside) props.onClose?.();
                isClickingOutside = false;
              }}
              className={
                "fixed z-10 inset-0 overflow-y-auto transition-transform "
              }
            >
              <div
                className={
                  "flex items-end justify-center min-h-screen text-center sm:block "
                }
              >
                {
                  /* This element is to trick the browser into centering the modal contents. */
                  !props.positioned && (
                    <span
                      className="hidden sm:inline-block sm:align-middle sm:h-screen"
                      aria-hidden="true"
                    >
                      &#8203;
                    </span>
                  )
                }
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom={
                    "opacity-0 pointer-events-none sm:translate-y-0 translate-y-4 sm:scale-95"
                  }
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo={
                    "opacity-0 pointer-events-none sm:translate-y-0 translate-y-4 sm:scale-95"
                  }
                >
                  <div
                    className={
                      "align-bottom bg-white dark:bg-slate-950 text-left w-full overflow-visible shadow-xl transform transition-all sm:align-middle " +
                      "relative inline-block rounded-tr-md rounded-tl-md sm:rounded-lg sm:my-8 w-full md:w-[95vw] sm:max-w-[400px] " +
                      "dark:border-slate-700 dark:border " +
                      (props.className || "")
                    }
                    style={props.style || {}}
                  >
                    {open && <ModalContext level={level.toString()} />}
                    {props.closable !== false && open && (
                      <div className="z-20 absolute top-0 right-1 pt-4 pr-4">
                        <Button
                          onClick={props.onClose}
                          size="sm"
                          theme="invisible"
                          icon={(p) => <XMarkIcon {...p} />}
                          shortcut={["esc"]}
                        />
                      </div>
                    )}
                    <ErrorBoundary>
                      <div
                        className="px-4 pt-5 pb-4 sm:p-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          isClickingOutside = false;
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          isClickingOutside = false;
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          isClickingOutside = false;
                        }}
                      >
                        {props.children}
                      </div>
                    </ErrorBoundary>
                  </div>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Transition.Root>,
        document.querySelector(".radix-themes") || document.body
      )}
    </>
  );
};

export const ModalContent = (props: {
  title: string | ReactNode;
  text?: string;
  buttons?: ReactNode;
  children?: ReactNode;
  icon?: any;
  theme?: "success" | "danger" | "warning" | "gray";
}) => {
  let color = "indigo";
  if (props.theme === "success") color = "green";
  if (props.theme === "danger") color = "red";
  if (props.theme === "warning") color = "orange";
  if (props.theme === "gray") color = "gray";
  return (
    <>
      <div className="sm:flex sm:items-start">
        {props.icon && (
          <div
            className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-${color}-100 sm:mx-0 sm:h-10 sm:w-10`}
          >
            <props.icon
              className={`h-6 w-6 text-${color}-600`}
              aria-hidden="true"
            />
          </div>
        )}
        <div
          className={
            "mt-3 text-center sm:mt-0 sm:text-left " +
            (props.icon ? "sm:ml-4" : "")
          }
        >
          <h3 className="-mt-2 text-xl font-semibold leading-6 font-medium text-gray-900 dark:text-white pr-6">
            <Heading size="3">{props.title}</Heading>
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-white">
              {props.text || ""}
            </p>
          </div>
        </div>
      </div>
      {props.buttons && (
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse text-center sm:text-left">
          {props.buttons}
        </div>
      )}
      {props.children}
    </>
  );
};
