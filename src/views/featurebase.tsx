import { ClientsUsers } from "@features/clients/types/clients";
import { useEffect } from "react";

export const SetupFeaturebase = ({
  clientUser,
}: {
  clientUser?: ClientsUsers;
}) => {
  useEffect(() => {
    console.log("clientUser", clientUser);
    if (!clientUser) return;

    const win = window as any;
    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }

    win.Featurebase(
      "identify",
      {
        // Each 'identify' call should include an "organization"
        // property, which is your Featurebase board's name before the
        // ".featurebase.app".
        organization: "linventaire",
        // Required fields. Replace with your customers data.
        // Both email and userId should be provided when possible
        // At minimum, either email or userId must be present
        email: "yourcustomer@example.com",
        name: "Your Customer",
        id: "123456",
        // Optional - add a profile picture to the user
        // profilePicture: "https://example.com/images/yourcustomer.png",
        // Optional - include other fields as needed
        // customFields: {
        //   title: "Product Manager",
        //   plan: "Premium",
        //   number: "123",
        // },
        // Optional, uncomment if you are looking to use multilingual changelog
        // locale: "en", // Will make sure the user receives the changelog email in the correct language
        // Optional - add user company information as needed
        // companies: [
        //   {
        //     id: "987654321", // required
        //     name: "Business Inc. 23", // required
        //     monthlySpend: 500, // optional
        //     createdAt: "2023-05-19T15:35:49.915Z", // optional
        //     customFields: {
        //       industry: "Fintech",
        //       location: "Canada",
        //     }, // optional
        //   },
        // ], // optional
      },
      (err: any) => {
        // Callback function. Called when identify completed.
        if (err) {
          console.error("FEATUREBASE ERROR", err);
        } else {
          console.log("Data sent successfully!");
        }
      }
    );
  }, [clientUser]);

  return <></>;
};
