import { Info } from "@atoms/text";

export const InfosArea = (props: {
  fields: { mainText: string; secondText: string }[];
  mainTextClassName?: string;
  secondTextClassName?: string;
}) => {
  return (
    <div className="h-full w-full flex flex-col mb-6">
      {props.fields.map((el, index) => (
        <div key={index}>
          <Info
            className={props.mainTextClassName ?? "text-amber-500 select-text"}
          >
            {el.mainText}
            {el.secondText.length > 0 && (
              <Info className={props.secondTextClassName ?? ""}>
                ({el.secondText})
              </Info>
            )}
          </Info>
        </div>
      ))}
    </div>
  );
};
