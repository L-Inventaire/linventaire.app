import { Alert } from "@atoms/alert";
import { Info } from "@atoms/text";
import { BellAlertIcon } from "@heroicons/react/24/outline";

export const WrongNumerotationFormat = () => {
  return (
    <div
      className="h-full flex flex-col justify-center items-center text-center overflow-hidden"
      style={{ minHeight: "50vh" }}
    >
      <Alert
        theme="danger"
        title="Mauvais format de numérotation"
        icon={BellAlertIcon}
      />
      <br />
      <Info>Demander à un administrateur de corrgier.</Info>
    </div>
  );
};
