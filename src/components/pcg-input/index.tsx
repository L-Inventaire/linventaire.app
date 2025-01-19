import pcg from "@assets/pcg.json";
import { Button, ButtonProps, DropdownMenu } from "@radix-ui/themes";
import { Fragment } from "react/jsx-runtime";

export const pgcLabel = (
  value: number | string,
  withNumber: boolean = true
) => {
  const findInPcg = (pcg: any[]): any => {
    for (const item of pcg) {
      if (`${item.number}` === `${value}`) return item.label;
      const found = findInPcg(item.accounts);
      if (found) return found;
    }
  };
  const res = findInPcg(pcg);
  if (!res) return "";
  return withNumber ? `${value} - ${res}` : res;
};

export const PCGInput = ({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
} & Omit<ButtonProps, "onChange" | "value">) => {
  const valueLabel = value ? pgcLabel(value) : "";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline" {...props}>
          {value ? valueLabel : "Choisir un compte"}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={() => onChange("512")}>
          512 - Banque
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => onChange("53")}>
          53 - Caisse
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => onChange("401")}>
          401 - Fournisseur
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => onChange("411")}>
          411 - Client
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        {pcg.map((item) => (
          <Fragment key={item.number}>
            {SubMenus(item.label, item.number, item.accounts, onChange)}
          </Fragment>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

const SubMenus = (
  title: string,
  value: number,
  accounts: any[],
  onSelect: any
) =>
  accounts?.length ? (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger>
        {value} - {title}
      </DropdownMenu.SubTrigger>
      <DropdownMenu.SubContent>
        {accounts.map((item) => (
          <Fragment key={item.number}>
            {SubMenus(item.label, item.number, item.accounts, onSelect)}
          </Fragment>
        ))}
      </DropdownMenu.SubContent>
    </DropdownMenu.Sub>
  ) : (
    <DropdownMenu.Item onSelect={() => onSelect(value)}>
      {value} - {title}
    </DropdownMenu.Item>
  );
