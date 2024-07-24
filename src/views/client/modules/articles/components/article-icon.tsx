import { Articles } from "@features/articles/types/types";
import {
  BriefcaseIcon,
  CubeIcon,
  CubeTransparentIcon,
} from "@heroicons/react/20/solid";

export const getArticleIcon =
  (type?: Articles["type"]) => (p: { className: string }) =>
    type === "service" ? (
      <BriefcaseIcon {...p} />
    ) : type === "consumable" ? (
      <CubeTransparentIcon {...p} />
    ) : (
      <CubeIcon {...p} />
    );
