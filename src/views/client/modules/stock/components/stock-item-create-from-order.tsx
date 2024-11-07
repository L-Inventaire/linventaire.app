import { useClients } from "@features/clients/state/use-clients";
import { useSetRecoilState } from "recoil";
import { SubdivideStockModalAtom } from "./subdivide-modal";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { Heading } from "@radix-ui/themes";

export const StockItemsCreateFromOrder = ({
  onBack,
  order: id,
}: {
  onBack: () => void;
  order: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { invoice: order, isPending } = useInvoice(id);

  if (!order) {
    if (!isPending) onBack();
    return <></>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-row mt-4 mb-2 items-center space-x-2">
        <Heading size="4">
          Réception à partir de la commande {order?.reference}
        </Heading>
      </div>
    </div>
  );
};
