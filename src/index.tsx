import "@features/utils/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import initReactFastclick from "react-fastclick";
import { RecoilRoot } from "recoil";
import "tippy.js/dist/tippy.css";
import reportWebVitals from "./reportWebVitals";
import InitialRouter from "./views";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import * as Sentry from "@sentry/react";

if (document.location.hostname !== "localhost") {
  Sentry.init({
    dsn: "https://2151be9374d10f3e255523941ac9cd2f@o4508291579969536.ingest.de.sentry.io/4508291606904912",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    environment: document.location.hostname,
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

initReactFastclick();

export const queryClient = new QueryClient();

const App = () => {
  return (
    <Theme
      accentColor={"" as any}
      grayColor="gray"
      radius="medium"
      scaling="90%"
      appearance="inherit"
      panelBackground="solid"
    >
      <QueryClientProvider client={queryClient}>
        <RecoilRoot>
          <DndProvider backend={HTML5Backend}>
            <InitialRouter />
          </DndProvider>
        </RecoilRoot>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </Theme>
  );
};

const element = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(element);
root.render(<App />);
export const AppRoot = root;

reportWebVitals();
