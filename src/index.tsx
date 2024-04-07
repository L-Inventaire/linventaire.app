import "@features/utils/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import initReactFastclick from "react-fastclick";
import { RecoilRoot } from "recoil";
import "simplebar-react/dist/simplebar.min.css";
import "tippy.js/dist/tippy.css";
import reportWebVitals from "./reportWebVitals";
import InitialRouter from "./views";

initReactFastclick();

export const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <InitialRouter />
      </RecoilRoot>
    </QueryClientProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);

reportWebVitals();
