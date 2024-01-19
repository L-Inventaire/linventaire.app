import _ from "lodash";
import Select, { SelectInputProps } from "./input-select";

export default function SelectBoolean(
  props: Omit<SelectInputProps, "value" | "children" | "onChange"> & {
    value: boolean;
    onChange: (v: boolean) => void;
  }
) {
  return (
    <Select
      value={props.value ? "1" : "0"}
      onChange={(e) => props.onChange(e.target.value === "1")}
      {..._.omit(props, "value", "children", "onChange")}
    >
      <option key={"OUI"} value={"1"}>
        OUI
      </option>
      <option key={"NON"} value={"0"}>
        NON
      </option>
    </Select>
  );
}
