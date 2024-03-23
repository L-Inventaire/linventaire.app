import { PageLoader } from "@components/page-loader";
import { useAuth } from "@features/auth/state/use-auth";
import { ROUTES } from "@features/routes";
import { useListenForShortcuts } from "@features/utils/shortcuts";
import { Suspense, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
} from "react-router-dom";
import { BackOfficeRoutes } from "./client";
import { LoginRoutes } from "./signin";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      {BackOfficeRoutes()}
      {LoginRoutes()}
      <Route path="*" element={<Navigate to={ROUTES.Login} />} />
      <Route path="" element={<Navigate to={ROUTES.Login} />} />
    </Route>
  )
);

export default function InitialRouter() {
  const { loading } = useAuth();
  useListenForShortcuts();

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
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </div>
    </Suspense>
  );
}
