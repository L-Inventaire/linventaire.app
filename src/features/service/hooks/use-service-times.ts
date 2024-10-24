import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { ServiceTimes } from "../types/types";
import { useEffect } from "react";

export const useServiceTimes = (options?: RestOptions<ServiceTimes>) => {
  const rest = useRest<ServiceTimes>("service_times", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { service_times: rest.items, ...rest };
};

export const useServiceTime = (id: string) => {
  const rest = useServiceTimes({ id });
  return {
    service_time: id ? (rest.service_times.data?.list || [])[0] : null,
    isPending: id ? rest.service_times.isPending : false,
    ...rest,
  };
};
