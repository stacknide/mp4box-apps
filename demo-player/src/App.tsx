import "./App.css";
import { Player } from "./Player";
import { ConfigModifier } from "./ConfigModifier/ConfigModifier";
import {
  playerResetKeyAtom,
  shouldUseCustomFetcherAtom,
} from "./ConfigModifier/atoms";
import { useAtom } from "jotai";

function App() {
  const [playerResetKey] = useAtom(playerResetKeyAtom);
  return (
    <>
      <Player key={playerResetKey} />
      <fieldset>
        <legend>File download config</legend>
        <DownloadModeSelector />
        <hr />
        <ConfigModifier />
      </fieldset>
    </>
  );
}

export default App;

function DownloadModeSelector() {
  const [shouldUseCustomFetcher, setShouldUseCustomFetcher] = //
    useAtom(shouldUseCustomFetcherAtom);
  return (
    <label style={{ display: "flex", gap: "10px" }}>
      Select download mode
      <label>
        <input
          type="radio"
          checked={!shouldUseCustomFetcher}
          onChange={() => setShouldUseCustomFetcher(false)}
        />
        HTTP Range request
      </label>
      <label>
        <input
          type="radio"
          checked={shouldUseCustomFetcher}
          onChange={() => setShouldUseCustomFetcher(true)}
        />
        Blocks range request (Züs multi-server download emulation)
      </label>
    </label>
  );
}
