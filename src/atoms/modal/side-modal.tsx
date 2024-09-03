import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ErrorBoundary } from "@views/error-boundary";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { atom, useSetRecoilState } from "recoil";

const SideModalsCountState = atom({
  key: "SideModalsState",
  default: 0,
});

const visibleModals = { value: 0 };

export const SideModal = (props: {
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  closable?: boolean;
  className?: string;
  style?: any;
  positioned?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const setSideModalsCountState = useSetRecoilState(SideModalsCountState);
  const [level, setLevel] = useState(0);
  const openStatus = useRef<boolean>(false);

  const onClose = useCallback(() => {
    openStatus.current = false;
    visibleModals.value += -1;
    setSideModalsCountState(visibleModals.value);
  }, [setSideModalsCountState]);

  const onOpen = useCallback(() => {
    openStatus.current = true;
    visibleModals.value += 1;
    setLevel(visibleModals.value);
    setSideModalsCountState(visibleModals.value);
  }, [setSideModalsCountState]);

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

  const zIndex = "z-" + level + "0";

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className={"relative " + zIndex}
        onClose={() => {
          //Nothing
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 pointer-events-none"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0 pointer-events-none"
        >
          <div
            className={
              "fixed inset-0 bg-opacity-25 dark:bg-opacity-75 transition-opacity " +
              (level === 1 ? "bg-black" : "bg-transparent")
            }
          />
        </Transition.Child>

        <div
          className={
            "fixed z-50 inset-0 overflow-y-auto transition-transform " +
            (level !== visibleModals.value && open
              ? "-translate-x-6 opacity-75 "
              : level !== visibleModals.value && !open
              ? "translate-x-6 opacity-75 "
              : "")
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
              enter="ease-out duration-300"
              enterFrom={
                "opacity-0 pointer-events-none sm:translate-y-0 translate-x-4"
              }
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo={
                "opacity-0 pointer-events-none sm:translate-y-0 translate-x-4"
              }
            >
              <Dialog.Panel
                className={
                  "text-black dark:text-white align-bottom bg-white dark:bg-slate-990 px-4 pt-5 pb-4 text-left w-full sm:w-auto shadow-xl transform transition-all sm:align-middle sm:p-6 " +
                  "absolute h-full top-0 right-0 m-0 rounded-none left-auto sm:w-auto overflow-auto " +
                  (props.className || "")
                }
                style={props.style || {}}
              >
                {props.closable !== false && (
                  <div className="z-20 absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      className="bg-slate-300 dark:bg-slate-600 rounded-full p-1 text-slate-600 dark:text-slate-300 hover:opacity-75 focus:outline-none "
                      onClick={() => props.onClose && props.onClose()}
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
                <ErrorBoundary>{props.children}</ErrorBoundary>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
