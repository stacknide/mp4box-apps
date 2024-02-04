import { useState } from "react";
import "./App.css";
import { Instructions } from "./Sections/Instructions";

function App() {
  const config = {
    url: "https://a0.muscache.com/airbnb/static/Paris-P1-1.mp4",
    progress: 0,
  };
  return (
    <>
      <h1>Demo</h1>
      <div style={{ position: "relative", width: "100%", display: "flex" }}>
        <video id="v" autoPlay controls style={{ width: `50%` }} />
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
          <input id="url" type="text" value={config.url} />
        </fieldset>

        <fieldset>
          <legend>Download/Playback Controls</legend>
          <button id="playButton" onClick={play} disabled>
            Play
          </button>
          <button id="loadButton" onClick={load} disabled>
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
      <Instructions />
    </>
  );
}

export default App;
