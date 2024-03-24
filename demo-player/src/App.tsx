import "./App.css";
import { Player } from "./Player";
import { ConfigModifier } from "./ConfigModifier/ConfigModifier";
import {
  playerResetKeyAtom,
  shouldUseCustomFetcherAtom,
  videoListAtom,
} from "./ConfigModifier/atoms";
import { useAtom } from "jotai";
import { useEffect } from "react";

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

  const [, setVideoList] = useAtom(videoListAtom);
  useEffect(() => {
    fetch("http://localhost:3000/media/list")
      .then((res) => res.json())
      .then((data) => setVideoList(data.videoList));
  }, []);

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
