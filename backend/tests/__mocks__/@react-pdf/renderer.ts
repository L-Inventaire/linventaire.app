import React from "react";

// Mock components for @react-pdf/renderer
export const Text = ({ children, ...props }: any) =>
  React.createElement("text", props, children);
export const View = ({ children, ...props }: any) =>
  React.createElement("view", props, children);
export const Document = ({ children, ...props }: any) =>
  React.createElement("document", props, children);
export const Page = ({ children, ...props }: any) =>
  React.createElement("page", props, children);
export const Image = ({ children, ...props }: any) =>
  React.createElement("image", props, children);
export const Link = ({ children, ...props }: any) =>
  React.createElement("link", props, children);
export const Svg = ({ children, ...props }: any) =>
  React.createElement("svg", props, children);
export const Path = ({ children, ...props }: any) =>
  React.createElement("path", props, children);

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const Font = {
  register: jest.fn(),
  registerHyphenationCallback: jest.fn(),
  registerEmojiSource: jest.fn(),
};

const ReactPDF = {
  renderToStream: jest.fn().mockResolvedValue({
    pipe: jest.fn(),
    on: jest.fn(),
  }),
  renderToBuffer: jest.fn().mockResolvedValue(Buffer.from("mock-pdf")),
  renderToFile: jest.fn().mockResolvedValue(undefined),
  render: jest.fn(),
  version: "4.0.0",
};

export default ReactPDF;
