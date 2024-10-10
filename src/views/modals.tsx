import { DropDownMenu } from "@atoms/dropdown";
import { CtrlKModal } from "@components/ctrl-k";
import { ContactRelationModal } from "./client/modules/contacts/components/relations-modal";
import { SubdivideStockModal } from "./client/modules/stock/components/subdivide-modal";

export const Modals = () => {
  return (
    <>
      <CtrlKModal />
      <DropDownMenu />
      <ContactRelationModal />
      <SubdivideStockModal />
    </>
  );
};
