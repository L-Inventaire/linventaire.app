import { Spinner } from "@radix-ui/themes";

export const PageLoader = () => {
  return (
    <div
      className="h-full flex justify-center items-center text-center overflow-hidden"
      style={{ minHeight: "50vh" }}
    >
      <Spinner />
    </div>
  );
};
