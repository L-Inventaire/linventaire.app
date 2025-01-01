import { Button } from "@atoms/button/button";
import { Modal } from "@atoms/modal/modal";
import { Clients } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";
import { useEffect, useState } from "react";
import { atom, useRecoilState } from "recoil";
import { countersDefaults, InvoiceNumerotationInput } from ".";

export const InvoiceNumerotationModalAtom = atom<{
  open: boolean;
  invoicesCounters: Partial<
    Clients["invoices_counters"] | Contacts["overrides"]["invoices_counters"]
  >;
  isCounters?: boolean;
  readonly?: boolean;
  onClose: () => void;
  onSave: (
    value: Partial<
      Clients["invoices_counters"] | Contacts["overrides"]["invoices_counters"]
    >
  ) => void;
}>({
  key: "InvoiceNumerotationModalAtom",
  default: {
    open: false,
    invoicesCounters: countersDefaults,
    isCounters: false,
    readonly: false,
    onClose: () => {},
    onSave: () => {},
  },
});

/** Modal using InvoiceNumerotationInput component */
export const InvoiceNumerotationModal = () => {
  const [modal, setModal] = useRecoilState(InvoiceNumerotationModalAtom);

  const [inputValue, setInputValue] = useState<
    Partial<
      Clients["invoices_counters"] | Contacts["overrides"]["invoices_counters"]
    >
  >({
    ...modal.invoicesCounters,
  } as Clients["invoices_counters"] | Contacts["overrides"]["invoices_counters"]);

  useEffect(() => {
    setInputValue({ ...modal.invoicesCounters });
  }, [modal.invoicesCounters]);

  return (
    <Modal
      open={modal.open}
      onClose={() => {
        setModal((mod) => ({ ...mod, open: false }));
        modal.onClose();
      }}
    >
      <InvoiceNumerotationInput
        invoicesCounters={inputValue ?? null}
        setInvoicesCounters={setInputValue}
        isCounters={modal.isCounters ?? false}
        disabled={modal.readonly}
      />
      {!modal.readonly && (
        <Button
          className="mt-4"
          theme="primary"
          size="md"
          disabled={modal.readonly}
          onClick={() => {
            if (!inputValue || modal.readonly) return;
            modal.onSave(inputValue);
            setModal((mod) => ({ ...mod, open: false }));
          }}
        >
          Enregistrer
        </Button>
      )}
    </Modal>
  );
};
