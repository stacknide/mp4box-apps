import "./App.css";
import { Player } from "./Player";
import { ConfigModifier } from "./ConfigModifier/ConfigModifier";
import { configAtom } from "./ConfigModifier/atoms";
import { useAtom } from "jotai";

function App() {
  const [config] = useAtom(configAtom);

  return (
    <>
      <Player key={Object.values(config).join("-")} />
      <fieldset>
        <legend>File download config</legend>
        <ConfigModifier />
      </fieldset>
    </>
  );
}

export default App;
