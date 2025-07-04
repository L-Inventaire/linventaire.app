import { DropDownMenu } from "@atoms/dropdown";
import { CtrlKModal } from "@components/ctrl-k";
import { EditorInputMentionHelper } from "@molecules/editor-input";
import { ContactRelationModal } from "./client/modules/contacts/components/relations-modal";
import { CRMItemsModal } from "./client/modules/crm/components/crm-items-modal";
import { RecurrenceModal } from "./client/modules/invoices/components/input-recurrence";
import { FurnishQuotesModal } from "./client/modules/invoices/components/invoice-actions/furnish-quotes/modal";
import { SubdivideStockModal } from "./client/modules/stock/components/subdivide-modal";

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
      <CRMItemsModal />
    </>
  );
};
