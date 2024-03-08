import { useEffect, useRef, useState } from "react";
import { Downloader, Mp4boxPlayer, PlayerControls } from "@knide/mp4box-player";
import { useAtom, useAtomValue } from "jotai";
import { configAtom, formatAtom } from "./ConfigModifier/atoms";

export function Player() {
  const [config] = useAtom(configAtom);

  const [controls, setControls] = useState<Partial<PlayerControls>>({});
  const {
    play,
    load,
    // initializeAllSourceBuffers,
    // initializeSourceBuffers,
    // start,
    // stop,
    // reset,
  } = controls;

  const vidRef = useRef(null);

  const format = useAtomValue(formatAtom);
  useEffect(() => {
    const downloader = new Downloader(vidRef.current);

    const shouldSetCustomLength =
      format === "hosted-online" && config.url.includes("Paris-P1-1.mp4");
    if (shouldSetCustomLength) downloader.setCustomTotalLength(28884979); // 28884979 = length of the test AirBnB mp4 file. This is needed because that test file's Content-Range header is not exposed by the server.

    downloader.setRealTime(true);
    const mp4boxPlayerInstance = //
      new Mp4boxPlayer(vidRef.current, config, downloader);

    setControls(mp4boxPlayerInstance.getControls());

    return () => {
      mp4boxPlayerInstance.stop();
    };
  }, []);

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
