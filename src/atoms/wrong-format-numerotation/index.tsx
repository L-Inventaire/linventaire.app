import { Alert } from "@atoms/alert";
import { Button } from "@atoms/button/button";
import { getRoute, ROUTES } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { BellAlertIcon, CheckIcon } from "@heroicons/react/24/outline";

export const WrongNumerotationFormat = () => {
  const navigate = useNavigateAlt();

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
      <Button
        size="lg"
        className="mt-4"
        icon={(p) => <CheckIcon {...p} />}
        onClick={() => {
          navigate(getRoute(ROUTES.SettingsPreferences));
        }}
      >
        Corriger
      </Button>
    </div>
  );
};
