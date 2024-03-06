"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Transcoder: () => Transcoder
});
module.exports = __toCommonJS(src_exports);

// src/Transcoder.ts
var import_ffmpeg = require("@ffmpeg/ffmpeg");
var import_util = require("@ffmpeg/util");
var import_nanoid = require("nanoid");
var Transcoder = class {
  ffmpeg;
  isReady = false;
  defaultConfig = {
    enableLogs: false,
    dist: "umd",
    enableMultiThreading: false
  };
  cfg = this.defaultConfig;
  constructor(config) {
    if (config)
      this.cfg = { ...this.defaultConfig, ...config };
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
    this.ffmpeg = new import_ffmpeg.FFmpeg();
  }
  load = async () => {
    const baseURL = `https://unpkg.com/@ffmpeg/core@0.12.6/dist/${this.cfg.dist}`;
    const ffmpeg = this.ffmpeg || new import_ffmpeg.FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      if (this.cfg.enableLogs)
        console.log(message);
    });
    await ffmpeg.load({
      coreURL: await (0, import_util.toBlobURL)(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await //
      (0, import_util.toBlobURL)(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      workerURL: this.cfg.enableMultiThreading ? await (0, import_util.toBlobURL)(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript") : void 0
    });
    this.isReady = true;
  };
  transcode = async ({ buffer, ext, id = (0, import_nanoid.nanoid)(), timeout }) => {
    if (!this.isReady)
      await this.load();
    if (!ext)
      throw new Error("Extension of the input video is required");
    const ffmpeg = this.ffmpeg;
    await ffmpeg.writeFile(`input-${id}.${ext}`, buffer);
    await ffmpeg.exec(
      ["-i", `input-${id}.${ext}`, `output-${id}.mp4`],
      timeout
    );
    const data = await ffmpeg.readFile(`output-${id}.mp4`);
    return data;
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Transcoder
});
