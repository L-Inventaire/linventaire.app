import { DropDownMenu } from "@atoms/dropdown";
import { CtrlKModal } from "@components/ctrl-k";
import { ContactRelationModal } from "./client/modules/contacts/components/relations-modal";
import { SubdivideStockModal } from "./client/modules/stock/components/subdivide-modal";
import { EditorInputMentionHelper } from "@molecules/editor-input";
import { RecurrenceModal } from "./client/modules/invoices/components/input-recurrence";
import { FurnishQuotesModal } from "./client/modules/invoices/components/invoice-actions/furnish-quotes-modal";
import { InvoiceNumerotationModal } from "@components/invoice-numerotation-input/modal";
import { CRMItemsModal } from "./client/modules/crm/components/crm-items-modal";

export const Modals = () => {
  return (
    <>
      <EditorInputMentionHelper />
      <CtrlKModal />
      <DropDownMenu />
      <ContactRelationModal />
      <SubdivideStockModal />
      <RecurrenceModal />
      <FurnishQuotesModal />
      <InvoiceNumerotationModal />
      <CRMItemsModal />
    </>
  );
};
