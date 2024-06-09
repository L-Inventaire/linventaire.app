import toast from "react-hot-toast";

export const copyToClipboard = (text: string, info?: string) => {
  navigator.clipboard.writeText(text);
  toast.success(info || "Copied to clipboard");
};
