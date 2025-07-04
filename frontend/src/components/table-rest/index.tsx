import { CtrlKAtom } from "@features/ctrlk/store";
import { useRegisterActiveSelection } from "@features/ctrlk/use-register-current-selection";
import { Table, TablePropsType } from "@molecules/table";
import { UseQueryResult } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";

export const RestTable = <T,>(
  props: Omit<
    TablePropsType<T>,
    "onSelect" | "rowIndex" | "loading" | "data" | "total"
  > & {
    entity: string;
    data: UseQueryResult<{ total: number; list: T[] }, Error>;
  }
) => {
  const openCtrlK = useSetRecoilState(CtrlKAtom);
  const registerActiveSelection = useRegisterActiveSelection();
  useEffect(() => {
    return () => registerActiveSelection(props.entity, []);
  }, []);

  return (
    <Table
      {..._.omit(props, "entity")}
      loading={props.data.isPending || props.data.isFetching}
      data={props.data?.data?.list || []}
      total={props.data?.data?.total || 0}
      rowIndex="id"
      onSelect={(items) => registerActiveSelection(props.entity, items)}
      onSelectedActionsClick={() =>
        openCtrlK((states) => [
          ...states,
          {
            ...(states[states.length - 1] || {}),
            path: [
              {
                mode: "action",
              },
            ],
          },
        ])
      }
    />
  );
};
