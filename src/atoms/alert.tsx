import { Section, SectionSmall } from "./text";

export const Alert = (props: {
  theme: "success" | "danger" | "warning" | "gray";
  title: string;
  icon: any;
  bullets?: string[];
  children?: React.ReactNode;
  className?: string;
}) => {
  let color = "blue";
  let textColor = "white";
  if (props.theme === "success") color = "blue-500";
  if (props.theme === "danger") color = "rose-500";
  if (props.theme === "warning") color = "amber-500";
  if (props.theme === "gray") {
    color = "slate-200";
    textColor = "slate-900";
  }

  return (
    <div
      className={
        `text-${textColor} bg-${color} p-4 flex items-center rounded-md ` +
        props.className
      }
    >
      <div className="flex items-center h-full" style={{ minHeight: 48 }}>
        <div className="flex-shrink-0">
          <props.icon className={`h-6 w-6`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <SectionSmall noColor className={`text-sm font-medium`}>
            {props.title}
          </SectionSmall>
          {(props.bullets || []).length > 0 && (
            <div className={`mt-2 text-sm text-${color}-800`}>
              <ul className="list-disc pl-5 space-y-1">
                {(props.bullets || []).map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}
          {props.children}
        </div>
      </div>
    </div>
  );
};
