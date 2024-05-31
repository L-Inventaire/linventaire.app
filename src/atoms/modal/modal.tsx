import { Section } from "@atoms/text";
import { useShortcuts } from "@features/utils/shortcuts";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ErrorBoundary } from "@views/error-boundary";
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { atom, useRecoilState } from "recoil";

const ModalsCountState = atom({
  key: "ModalsState",
  default: 0,
});

const visibleModals = { value: 0 };

export const Modal = (props: {
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  closable?: boolean;
  className?: string;
  style?: any;
  positioned?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [modalsCountState, setModalsCountState] =
    useRecoilState(ModalsCountState);
  const [level, setLevel] = useState(0);
  const openStatus = useRef<boolean>(false);

  const onClose = useCallback(() => {
    openStatus.current = false;
    visibleModals.value += -1;
    setModalsCountState(visibleModals.value);
  }, [setModalsCountState]);

  const onOpen = useCallback(() => {
    openStatus.current = true;
    visibleModals.value += 1;
    setLevel(visibleModals.value);
    setModalsCountState(visibleModals.value);
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

  const zIndex = "z-" + level + "0";

  useShortcuts(
    ["esc"],
    () => props.closable !== false && props.onClose && props.onClose()
  );

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
            (level !== modalsCountState && open
              ? "-translate-y-6 sm:scale-95 opacity-75 "
              : level !== modalsCountState && !open
              ? "translate-y-6 sm:scale-95 opacity-75 "
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
                "opacity-0 pointer-events-none sm:translate-y-0 translate-y-4 sm:scale-95"
              }
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo={
                "opacity-0 pointer-events-none sm:translate-y-0 translate-y-4 sm:scale-95"
              }
            >
              <Dialog.Panel
                className={
                  "align-bottom bg-white dark:bg-wood-990 px-4 pt-5 pb-4 text-left w-full sm:w-auto overflow-hidden shadow-xl transform transition-all sm:align-middle sm:p-6 " +
                  "relative inline-block rounded-tr-xl rounded-tl-xl sm:rounded-lg sm:my-8 w-full sm:w-full sm:max-w-[400px] " +
                  (props.className || "")
                }
                style={props.style || {}}
              >
                {props.closable !== false && (
                  <div className="z-20 absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      className="bg-wood-300 dark:bg-wood-600 rounded-full p-1 text-wood-600 dark:text-wood-300 hover:opacity-75 focus:outline-none "
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
          <Dialog.Title
            as="h3"
            className="-mt-2 text-xl font-semibold leading-6 font-medium text-gray-900 dark:text-white pr-6"
          >
            <Section>{props.title}</Section>
          </Dialog.Title>
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
