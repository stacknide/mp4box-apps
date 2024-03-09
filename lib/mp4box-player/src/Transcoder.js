import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { nanoid } from "nanoid";

type TDist = "umd" | "esm";
type TConfig = {
  enableLogs: boolean;
  dist: TDist;
  enableMultiThreading: boolean;
};
type TTranscode = {
  inputData: Uint8Array | string;
  id: string;
  timeout?: number;
  ext?: string;
};
export class Transcoder {
  public ffmpeg: FFmpeg;
  private isReady = false;

  defaultConfig: TConfig = {
    enableLogs: false,
    dist: "umd",
    enableMultiThreading: false,
  };
  private cfg = this.defaultConfig;

  constructor(config?: TConfig) {
    if (config) this.cfg = { ...this.defaultConfig, ...config };

    if (this.cfg.enableMultiThreading) {
      const refer = `Refer https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements"`;
      if (!window.crossOriginIsolated) {
        throw new Error(
          `Cross-origin isolation is required to enable multi-threading. ${refer}`
        );
      }

      if (!window.isSecureContext) {
        throw new Error(
          `Secure context is required to enable multi-threading. ${refer}`
        );
      }
    }

    this.ffmpeg = new FFmpeg();
  }

  load = async () => {
    const baseURL = `https://unpkg.com/@ffmpeg/core@0.12.6/dist/${this.cfg.dist}`;
    const ffmpeg = this.ffmpeg || new FFmpeg();

    ffmpeg.on("log", ({ message }) => {
      if (this.cfg.enableLogs) console.log(message);
    });

    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await //
      toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await //
      toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
    });

    this.isReady = true;
  };

  transcode = async ({
    inputData,
    ext,
    id = nanoid(),
    timeout,
  }: TTranscode) => {
    if (!this.isReady) await this.load();
    if (!ext) throw new Error("Extension of the input video is required");

    const ffmpeg = this.ffmpeg;
    await ffmpeg.writeFile(`input-${id}.${ext}`, inputData);
    await ffmpeg.exec(
      ["-i", `input-${id}.${ext}`, `output-${id}.mp4`],
      timeout
    );
    const data = await ffmpeg.readFile(`output-${id}.mp4`);
    return data;
  };
}
