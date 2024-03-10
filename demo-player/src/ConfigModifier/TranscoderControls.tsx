import { useAtom } from "jotai";
import { transcoderConfigAtom, useActiveFormat } from "./atoms";

export function TranscoderControls() {
  const [config, setConfig] = useAtom(transcoderConfigAtom);
  const activeFormat = useActiveFormat();
  return (
    <fieldset style={{ marginLeft: "10px" }}>
      <legend>FFMPEG Transcoder config</legend>
      <label>
        <input type="checkbox" />
        Enable Transcoding
      </label>
      <p>
        This will transcode <span>{activeFormat}</span> video chunks to
        <span> mp4 </span>
      </p>
      <p>
        The transcoded <span>mp4</span> chunk will be fed to mp4box player to
        perform fragmentation
      </p>

      <hr />

      <div style={{ display: "flex", gap: "10px" }}>
        <label>
          <input
            type="checkbox"
            checked={config.enableLogs}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, enableLogs: e.target.checked }))
            }
          />
          Enable logs
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.enableMultiThreading}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                enableMultiThreading: e.target.checked,
              }))
            }
          />
          Enable multi-threading
        </label>
      </div>
      <div>
        <br />
        <label>
          <input
            type="checkbox"
            checked={config.enableProgressIndicator}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                enableProgressIndicator: e.target.checked,
              }))
            }
          />
          Enable progress indicator&nbsp;
          <a
            href="https://ffmpegwasm.netlify.app/docs/getting-started/usage/#transcode-video-with-progress-experimental"
            target="_blank"
          >
            (experimental)
          </a>
        </label>
        <pre>
          Transcoding Progress:{" "}
          {config.enableProgressIndicator
            ? `${config.progress}%`
            : "NA - Not enabled"}
        </pre>
      </div>
    </fieldset>
  );
}
