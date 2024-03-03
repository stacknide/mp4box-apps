import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Downloader, Mp4boxPlayer } from "@knide/mp4box-player";

const config = {
  // url: "https://a0.muscache.com/airbnb/static/Paris-P1-1.mp4", // test AirBnB mp4 file
  url: "http://localhost:3000/media/range/airbnb.mp4",
  segmentSize: 1000,
  chunkSize: 1000000,
  chunkTimeout: 500,
  extractionSize: 1,
};

/** @type {import("@knide/mp4box-player").PlayerControls} */
const defaultControls = {};

function App() {
  const [controls, setControls] = useState(defaultControls);
  const vidRef = useRef(null);

  useEffect(() => {
    const downloader = new Downloader(vidRef.current);
    downloader.setCustomTotalLength(28884979); // 28884979 = length of the test AirBnB mp4 file. This is needed because that test file's Content-Range header is not exposed by the server.
    const mp4boxPlayerInstance = //
      new Mp4boxPlayer(vidRef.current, config, downloader);

    setControls(mp4boxPlayerInstance.getControls());
  }, []);

  const {
    play,
    load,
    // initializeAllSourceBuffers,
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
          <div id="overlayProgress">Progress: {config.progress}</div>
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
          <button id="playButton" onClick={play}>
            Play
          </button>
          <button id="loadButton" onClick={load}>
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

export default App;
