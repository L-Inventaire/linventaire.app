import { RestEntity } from "@features/utils/rest/types/types";

export type Articles = RestEntity & {
  favorite: boolean;
  assigned: string[];

  type: "product" | "service" | "consumable";
  name: string;
  description: string;
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
  unit: string;
  tva: string;
  subscription: "" | "daily" | "monthly" | "yearly" | "weekly";
  subscription_duration: number;

  notes: string;
  documents: string[];
  tags: string[];

  fields: any;
};
