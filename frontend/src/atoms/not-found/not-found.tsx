import { Title } from "@atoms/text";

export type NotFoundProps = {
  item?: string;
};

export const NotFound = ({ item = "Item" }) => {
  return (
    <div
      className="flex flex-col w-full h-full justify-center items-center"
      style={{ minHeight: "50vh" }}
    >
      <Title className="block">{item} not found</Title>
      <div className="w-full md:w-1/2 mt-12">
        <img className="Image" src="/medias/not-found.svg" alt="Not found" />
      </div>
    </div>
  );
};
