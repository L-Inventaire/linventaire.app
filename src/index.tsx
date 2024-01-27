import "@features/utils/i18n";
import ReactDOM from "react-dom/client";
import initReactFastclick from "react-fastclick";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import "tippy.js/dist/tippy.css";
import "simplebar-react/dist/simplebar.min.css";
import reportWebVitals from "./reportWebVitals";
import InitialRouter from "./views";
initReactFastclick();

const App = () => {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <InitialRouter />
      </BrowserRouter>
    </RecoilRoot>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);

reportWebVitals();
