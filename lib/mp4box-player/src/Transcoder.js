import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"
import { nanoid } from "nanoid"

export class Transcoder {
  isReady = false

  defaultConfig = {
    enableLogs: false,
    dist: "umd",
    enableMultiThreading: false
  }
  cfg = this.defaultConfig

  constructor(config) {
    if (config) this.cfg = { ...this.defaultConfig, ...config }

    if (this.cfg.enableMultiThreading) {
      const refer = `Refer https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements"`
      if (!window.crossOriginIsolated) {
        throw new Error(
          `Cross-origin isolation is required to enable multi-threading. ${refer}`
        )
      }

      if (!window.isSecureContext) {
        throw new Error(
          `Secure context is required to enable multi-threading. ${refer}`
        )
      }
    }

    this.ffmpeg = new FFmpeg()
  }

  load = async () => {
    const ffmpeg = this.ffmpeg || new FFmpeg()
    ffmpeg.on("log", ({ message }) => {
      if (this.cfg.enableLogs) console.log(message)
    })

    const baseURL = `https://unpkg.com/@ffmpeg/core@0.12.4/dist/${this.cfg.dist}`
    const coreUrl = `${baseURL}/ffmpeg-core.js`
    const wasmUrl = `${baseURL}/ffmpeg-core.wasm`
    const workerUrl = `${baseURL}/ffmpeg-core.worker.js`

    try {
      const ffmpeg = this.ffmpeg || new FFmpeg()

      const safeCoreUrl = await toBlobURL(coreUrl, "text/javascript")
      const safeWasmUrl = await toBlobURL(wasmUrl, "application/wasm")
      const safeWorkerUrl = this.cfg.enableMultiThreading
        ? await toBlobURL(workerUrl, "text/javascript")
        : undefined

      await ffmpeg.load({
        coreURL: safeCoreUrl,
        wasmURL: safeWasmUrl,
        workerURL: safeWorkerUrl
      })
    } catch (e) {
      console.log(e)
    }
    this.isReady = true
  }

  transcode = async ({ input, ext, id = nanoid(), timeout }) => {
    if (!this.isReady) await this.load()
    if (!ext) throw new Error("Extension of the input video is required")

    const ffmpeg = this.ffmpeg
    await ffmpeg.writeFile(`input-${id}.${ext}`, input)
    await ffmpeg.exec(["-i", `input-${id}.${ext}`, `output-${id}.mp4`], timeout)
    const data = await ffmpeg.readFile(`output-${id}.mp4`)
    return data
  }
}
