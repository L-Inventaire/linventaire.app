import { NavigateOptions, useNavigate } from "react-router-dom";

export const useNavigateAlt = () => {
  const navigate = useNavigate();
  return (path: string, options?: NavigateOptions & { event: MouseEvent }) => {
    if (
      options?.event?.metaKey ||
      options?.event?.ctrlKey ||
      options?.event?.shiftKey
    )
      return window.open(path, "_blank");
    navigate(path, options);
  };
};
