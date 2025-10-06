import "@features/articles/configuration";
import { useClients } from "./clients/state/use-clients";

const App = () => {
  useClients();
  return null;
};

export default App;
