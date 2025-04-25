import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { useState } from "react";
import { Button, ButtonProps } from "./button";
import { Modal, ModalContent } from "../modal/modal";

interface ButtonConfirmProps extends ButtonProps {
  confirmTitle?: string;
  confirmMessage?: string;
  confirmIcon?: React.ReactNode;
  confirmButtonTheme?: "primary" | "secondary" | "danger" | "default";
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export const ButtonConfirm = (props: ButtonConfirmProps) => {
  const [inConfirm, setInConfirm] = useState(false);
  return (
    <>
      <Button
        {..._.omit(
          props,
          "onClick",
          "confirmButtonTheme",
          "confirmButtonText",
          "cancelButtonText",
          "confirmTitle",
          "confirmMessage",
          "confirmIcon"
        )}
        onClick={() => {
          setInConfirm(true);
        }}
      />
      <Modal
        open={inConfirm}
        onClose={() => {
          setInConfirm(false);
        }}
      >
        <ModalContent
          title={props.confirmTitle || "Confirmer l'action ?"}
          text={props.confirmMessage || "Cliquez sur confirmer pour continuer."}
          icon={props.confirmIcon || ExclamationCircleIcon}
          buttons={
            <>
              <Button
                theme={props.confirmButtonTheme || "primary"}
                onClick={(e) => {
                  setInConfirm(false);
                  setTimeout(() => {
                    props.onClick && props.onClick(e);
                  }, 500);
                }}
                className="mt-2"
                shortcut={["enter"]}
              >
                {props.confirmButtonText || "Confirmer"}
              </Button>
              <Button
                onClick={() => {
                  setInConfirm(false);
                }}
                theme="outlined"
                className={"mr-4 mt-2"}
                shortcut={["esc"]}
              >
                {props.cancelButtonText || "Annuler"}
              </Button>
            </>
          }
        />
      </Modal>
    </>
  );
};
