import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  useRest,
  useRestMainOptions,
} from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";

export const DocumentBarNav = (props: {
  entity: string;
  id: string;
  getRoute: (id: string) => string;
}) => {
  // Get current result list for entity, and automatically pre-load next/previous + new/prev pages
  const { options, setOptions } = useRestMainOptions<RestEntity>(props.entity);
  const { items } = useRest<RestEntity>(props.entity, options);

  const list = items?.data?.list;

  const currentItemPosition = list?.findIndex((a) => a.id === props.id);
  const nextItem = list?.find((_e, i) => list[i - 1]?.id === props.id)?.id;
  const prevItem = list?.find((_e, i) => list[i + 1]?.id === props.id)?.id;

  const navigate = useNavigateAlt();

  useEffect(() => {
    const total = Math.floor((options?.limit || 20) - 2); // Minus 2 to keep the current item in it
    // Load next page if needed / load previous page if needed
    if (!prevItem && (options?.offset || 0) > 0) {
      // Reduce offset
      setOptions({
        ...options,
        offset: Math.max(0, (options?.offset || 0) - total),
      });
    } else if (
      !nextItem &&
      (options?.offset || 0) + (options?.limit || 20) <
        (items?.data?.total || 0)
    ) {
      // Increase offset
      setOptions({
        ...options,
        offset: (options?.offset || 0) + total,
      });
    }
  }, [nextItem, prevItem]);

  if (!options || !props.id || props.id === "new") return null;

  if (options.offset === undefined || !items?.data?.total) {
    return;
  }

  return (
    <>
      <Button
        onClick={(e) =>
          prevItem && navigate(props.getRoute(prevItem), e as any)
        }
        data-tooltip="Précédent"
        size="xs"
        theme="outlined"
        shortcut={["k"]}
        icon={(p) => <ChevronUpIcon {...p} />}
        disabled={!prevItem}
      />
      <Button
        onClick={(e) =>
          nextItem && navigate(props.getRoute(nextItem), e as any)
        }
        data-tooltip="Suivant"
        size="xs"
        theme="outlined"
        shortcut={["j"]}
        icon={(p) => <ChevronDownIcon {...p} />}
        disabled={!nextItem}
      />
      <Info className="pl-2">
        {`Élément ${
          (options.offset || 0) + (currentItemPosition || 0) + 1
        } sur ${items?.data?.total}`}
      </Info>
    </>
  );
};
