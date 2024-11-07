import { useClients } from "@features/clients/state/use-clients";
import { useSetRecoilState } from "recoil";
import { SubdivideStockModalAtom } from "./subdivide-modal";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Heading, Table } from "@radix-ui/themes";
import { getContactName } from "@features/contacts/types/types";
import { RestDocumentsInput } from "@components/input-rest";
import Link from "@atoms/link";

export const StockItemsCreateFromSupplier = ({
  onBack,
  supplier: id,
}: {
  onBack: () => void;
  supplier: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { contact: supplier, isPending } = useContact(id);

  if (!supplier) {
    if (!isPending) onBack();
    return <></>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-row mt-4 mb-2 items-center space-x-2">
        <Heading size="4">
          Réception à partir du fournisseur {getContactName(supplier!)}
        </Heading>
      </div>
      <Link onClick={() => onBack()}>
        Démarrer directement depuis une commande ?
      </Link>

      <Table.Root className="mt-6">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Numéro de série</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Quantité</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              Localisation (livré, stock, étagère)
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Affectation (devis)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
              Actions (supprimer / dupliquer)
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body></Table.Body>
      </Table.Root>
    </div>
  );
};
