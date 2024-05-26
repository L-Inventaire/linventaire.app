import React from "react";
import "@assets/font/inter/Inter-bold";

type PdfLayoutProps = React.PropsWithChildren & React.ComponentProps<"div">;

export const PDFLayout = ({ children, ...props }: PdfLayoutProps) => {
  return (
    <div {...props}>
      <link href="/styles/tailwind.css?t=1" rel="stylesheet" />
      <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      {children}
    </div>
  );
};
