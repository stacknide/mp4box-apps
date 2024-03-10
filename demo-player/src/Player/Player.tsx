import { useEffect, useRef, useState } from "react";
import {
  Downloader,
  Mp4boxPlayer,
  PlayerControls,
  Transcoder,
} from "@knide/mp4box-player";
import { useAtomValue } from "jotai";
import {
  blockSizeAtom,
  configAtom,
  formatAtom,
  shouldUseCustomFetcherAtom,
  transcoderConfigAtom,
} from "../ConfigModifier/atoms";
import { useCustomBufferFetcher } from "./useCustomBufferFetcher";
import { TranscoderControls } from "../ConfigModifier/TranscoderControls";

export const PARIS_VIDEO_BYTES = 28884979;

export function Player() {
  const config = useAtomValue(configAtom);
  const blockSize = useAtomValue(blockSizeAtom);

  const [controls, setControls] = useState<Partial<PlayerControls>>({});
  const {
    play,
    load,
    // initializeAllSourceBuffers,
    // initializeSourceBuffers,
    // start,
    stop,
    reset,
  } = controls;

  const vidRef = useRef(null);

  const shouldUseCustomFetcher = useAtomValue(shouldUseCustomFetcherAtom);
  const dl = useCustomBufferFetcher();

  const format = useAtomValue(formatAtom);
  const transcoderConfig = useAtomValue(transcoderConfigAtom);
  useEffect(() => {
    if (!vidRef.current) return;

    const transcoder = new Transcoder(transcoderConfig);

    const ext = config.url.split(".").pop() || "";
    const isSupported = ["mp4", "3gp", "mov"].includes(ext.toLowerCase());

    const _transcoder = isSupported ? undefined : transcoder;
    const downloader = new Downloader(vidRef.current, _transcoder);

    if (shouldUseCustomFetcher)
      downloader.setBufferFetcher(dl.abortableDownloadByteRange);

    const isTestAirBnbVideo =
      format === "hosted-online" && config.url.includes("Paris-P1-1.mp4");
    if (isTestAirBnbVideo) downloader.setCustomTotalLength(PARIS_VIDEO_BYTES); // PARIS_VIDEO_BYTES = length of the test AirBnB mp4 file. This is needed because that file's Content-Range header is not exposed by the server.

    downloader.setRealTime(true); // TODO: create a control to toggle this

    const customChunkSize = shouldUseCustomFetcher
      ? blockSize * config.numOfBlocks
      : config.chunkSize;
    const cfg = { ...config, chunkSize: customChunkSize };
    const mp4boxPlayerInstance = //
      new Mp4boxPlayer(vidRef.current, cfg, downloader);

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
          {/* <div
            id="overlayTracks"
            style={{ height: "30%", background: `#808080` }}
          /> */}
          {/* <div id="overlayProgress">Progress: {config.progress}</div> */}

          <div id="transcoding">
            <TranscoderControls />
          </div>
        </div>
      </div>
      <p>
        Do not use the play button given in the video controls.&nbsp;
        <strong>Use the Play button from the Player Controls.</strong>
      </p>
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
          <button id="stopButton" onClick={() => stop?.()}>
            Stop Media Download
          </button>
          <button onClick={() => reset?.()}>Reset</button>
          {/* <button id="initAllButton" onClick={initializeAllSourceBuffers}>
            Add and Initialize All Source Buffers
          </button>
          <button id="initButton" onClick={initializeSourceBuffers}>
            Initialize Source Buffers
          </button>
          <button id="startButton" onClick={start}>
            Load Media Data &amp; Play
          </button>
         */}
        </fieldset>
      </section>
    </>
  );
}
