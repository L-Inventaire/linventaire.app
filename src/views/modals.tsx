import { DropDownMenu } from "@atoms/dropdown";
import { CtrlKModal } from "@components/ctrl-k";
import { ContactRelationModal } from "./client/modules/contacts/components/relations-modal";

export const Modals = () => {
  return (
    <>
      <CtrlKModal />
      <DropDownMenu />
      <ContactRelationModal />
    </>
  );
};
