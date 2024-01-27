import Link from "@atoms/link";
import { Base, BaseSmall } from "@atoms/text";
import { ROUTES } from "@features/routes";
import { AcademicCapIcon, SupportIcon } from "@heroicons/react/outline";
import { useTranslation } from "react-i18next";
import { Account } from "./account";
import { Search } from "./search";

export const Header = () => {
  return (
    <div className="bg-blue-500 h-14 flex flex-row justify-center items-center px-2 sm:px-4 min-h-0 shrink-0 z-60 text-white">
      <div className="flex flex-row items-center justify-center ml-4">
        <Logo />
      </div>
      <div className="grow flex items-center justify-center">
        <Search />
      </div>
      <div className="flex flex-row items-center justify-center ml-4">
        <Links />
        <Account />
      </div>
    </div>
  );
};

const Logo = () => (
  <Link
    to={ROUTES.Home}
    noColor
    className="flex-row items-center mr-4 mr-8 flex"
  >
    <img src="/medias/logo.svg" className="h-6" alt="Simple" />
    <Base noColor className="inline-flex ml-2 md:inline-flex hidden">
      Simple
    </Base>
  </Link>
);

const Links = () => {
  const { t } = useTranslation();
  return (
    <>
      <Link
        target="_BLANK"
        href="https://google.com"
        noColor
        className="hidden md:inline-flex flex-row"
      >
        <AcademicCapIcon className="h-5 mr-2" />
        <BaseSmall noColor>{t("header.guides")}</BaseSmall>
      </Link>
      <Separator />
      <Link
        target="_BLANK"
        href="mailto:"
        noColor
        className="hidden md:inline-flex flex-row"
      >
        <SupportIcon className="h-5 mr-2" />
        <BaseSmall noColor>{t("header.support")}</BaseSmall>
      </Link>
      <Separator />
    </>
  );
};

const Separator = () => (
  <div className="hidden md:inline h-5 mx-4 border-solid border-r border-white opacity-50 inline-block"></div>
);
