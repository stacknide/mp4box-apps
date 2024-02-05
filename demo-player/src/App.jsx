import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Instructions } from "./Sections/Instructions";
import { Mp4boxPlayer } from "@knide/mp4box-player";

const config = {
  url: "https://a0.muscache.com/airbnb/static/Paris-P1-1.mp4",
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
    let mp4boxPlayerInstance = new Mp4boxPlayer(vidRef.current, config);
    setControls(mp4boxPlayerInstance.getControls());
  }, []);

  const {
    play,
    load,
    initializeAllSourceBuffers,
    initializeSourceBuffers,
    start,
    stop,
    reset,
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
        <fieldset>
          <label>URL:</label>
          <input id="url" type="text" defaultValue={config.url} />
        </fieldset>

        <fieldset>
          <legend>Download/Playback Controls</legend>
          <button id="playButton" onClick={play}>
            Play
          </button>
          <button id="loadButton" onClick={load}>
            Load Media Info
          </button>
          <button
            id="initAllButton"
            onClick={initializeAllSourceBuffers}
            disabled
          >
            Add and Initialize All Source Buffers
          </button>
          <button id="initButton" onClick={initializeSourceBuffers} disabled>
            Initialize Source Buffers
          </button>
          <button id="startButton" onClick={start} disabled>
            Load Media Data &amp; Play
          </button>
          <button id="stopButton" onClick={stop} disabled>
            Stop Media Download
          </button>
          <button onClick={reset}>Reset</button>
          <br />
          {/* <label for="playback_rate_range">Playback Rate</label> */}
          {/* <input
            id="playback_rate_range"
            name="playback_rate_range"
            type="range"
            min="1"
            max="20"
            step="1"
            value="1"
            oninput="setPlaybackRate(this.value);"
          /> */}
          {/* <output id="playback_rate_range_out" for="playback_rate_range">
            1
          </output> */}
        </fieldset>
      </section>

      <section id="dummy-stuff">
        <label htmlFor="url">URL:</label>
        <input id="url" type="text" />

        <div id="dlTimeout">
          <label htmlFor="chunk_speed_range">
            Download Timeout (milliseconds)
          </label>
          <input
            id="chunk_speed_range"
            name="chunk_speed_range"
            type="range"
            min="0"
            max="10000"
            step="100"
            defaultValue="500"
          />
          <output id="chunk_speed_range_out">500</output>
        </div>

        <div>
          <label htmlFor="chunk_size_range">Download Chunk Size (bytes)</label>
          <input
            id="chunk_size_range"
            name="chunk_size_range"
            type="range"
            min="0"
            max="10000000"
            step="1000"
            defaultValue="1000000"
          />
          <output id="chunk_size_range_out">1000000</output>
        </div>

        <div id="infoDiv"></div>
        <div id="html5MediaDiv"></div>

        <select id="urlSelector"></select>

        <input id="saveChecked" type="checkbox" />

        <div id="progressbar"></div>
        <div id="progresslabel"></div>
      </section>

      <Instructions />
    </>
  );
}

export default App;
