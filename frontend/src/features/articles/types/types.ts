import { RestEntity } from "@features/utils/rest/types/types";

export type Articles = RestEntity & {
  favorite: boolean;
  assigned: string[];

  type: "product" | "service" | "consumable";
  name: string;
  description: string;
  internal_reference: string;
  supplier_reference: string;
  suppliers: string[];
  suppliers_details: {
    [key: string]: {
      reference: string;
      price: number;
      delivery_time: number;
      delivery_quantity: number;
    };
  };

  price: number;
  unit: string;
  tva: string;
  subscription: "" | "daily" | "monthly" | "yearly" | "weekly" | string;

  accounting: ArticleAccounting;

  notes: string;
  documents: string[];
  tags: string[];

  fields: any;
};

type ArticleAccounting = {
  standard_identifier: string; // Numéro sur le plan comptable
  standard: "pcg" | "ifrs"; // Plan Comptable Général, dans le futur pourrait être étendu à d'autres standards
  name: string;
};
