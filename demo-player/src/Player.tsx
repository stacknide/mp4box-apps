import { useEffect, useRef, useState } from "react";
import { Downloader, Mp4boxPlayer, PlayerControls } from "@knide/mp4box-player";

export function Player({ config = {} }) {
  const [controls, setControls] = useState<Partial<PlayerControls>>({});
  const vidRef = useRef(null);

  useEffect(() => {
    const downloader = new Downloader(vidRef.current);
    downloader.setCustomTotalLength(28884979); // 28884979 = length of the test AirBnB mp4 file. This is needed because that test file's Content-Range header is not exposed by the server.
    downloader.setRealTime(true);
    const mp4boxPlayerInstance = //
      new Mp4boxPlayer(vidRef.current, config, downloader);

    setControls(mp4boxPlayerInstance.getControls());
  }, []);

  const {
    play,
    load,
    // i.nitializeAllSourceBuffers,
    // initializeSourceBuffers,
    // start,
    // stop,
    // reset,
  } = controls;

  return (
    <>
      <h1>Demo</h1>
      <div style={{ position: "relative", width: "100%", display: "flex" }}>
        <video id="v" autoPlay controls style={{ width: `50%` }} ref={vidRef} />
        <div style={{ width: `50%` }}>
          <div
            id="overlayTracks"
            style={{ height: "80%", background: `#808080` }}
          />
          Do not use the play button given in the video controls. Use the Play
          button from the Player Controls.
          {/* <div id="overlayProgress">Progress: {config.progress}</div> */}
        </div>
      </div>

      <section id="tabs-1">
        <h1>Player Controls</h1>
        <div>
          <label>URL:</label>
          <span> {config.url}</span>
        </div>

        <fieldset>
          <legend>Download/Playback Controls</legend>
          <button id="playButton" onClick={() => play?.()}>
            Play
          </button>
          <button id="loadButton" onClick={() => load?.()}>
            Load Media Info
          </button>
          {/* <button id="initAllButton" onClick={initializeAllSourceBuffers}>
            Add and Initialize All Source Buffers
          </button>
          <button id="initButton" onClick={initializeSourceBuffers}>
            Initialize Source Buffers
          </button>
          <button id="startButton" onClick={start}>
            Load Media Data &amp; Play
          </button>
          <button id="stopButton" onClick={stop}>
            Stop Media Download
          </button>
          <button onClick={reset}>Reset</button> */}
        </fieldset>
      </section>
    </>
  );
}
