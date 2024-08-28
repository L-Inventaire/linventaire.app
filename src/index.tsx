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

initReactFastclick();

export const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <DndProvider backend={HTML5Backend}>
          <InitialRouter />
        </DndProvider>
      </RecoilRoot>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);

reportWebVitals();
