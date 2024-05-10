import { RestEntity } from "@features/utils/rest/types/types";

export type Articles = RestEntity & {
  favorite: boolean;
  assigned: string[];

  name: string;
  type: string;
  internal_reference: string;
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
  cost: number;

  stock: number;
  stock_expected: number;
  stock_bought: number;

  notes: string;
  documents: string[];
  tags: string[];

  fields: any;
};
