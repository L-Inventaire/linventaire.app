import { PageLoader } from "@components/page-loader";
import { useAuth } from "@features/auth/state/use-auth";
import { ROUTES } from "@features/routes";
import { Suspense, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BackOfficeRoutes } from "./client";
import { LoginRoutes } from "./signin";
import { useListenForShortcuts } from "@features/utils/shortcuts";

export default function InitialRouter() {
  const { pathname } = useLocation();
  const { loading } = useAuth();
  useListenForShortcuts();

  useEffect(() => {
    console.log("Navigate to:", pathname);
    window.scrollTo(0, 0);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-white">
        <PageLoader />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-wood-50">
          <PageLoader />
        </div>
      }
    >
      <div className="flex min-h-full dark:bg-wood-990 bg-wood-50 h-full">
        <Routes>
          <Route path="/">
            {BackOfficeRoutes()}
            {LoginRoutes()}
            <Route path="*" element={<Navigate to={ROUTES.Login} />} />
            <Route path="" element={<Navigate to={ROUTES.Login} />} />
          </Route>
        </Routes>
        <Toaster position="top-center" />
      </div>
    </Suspense>
  );
}
