// src/Transcoder.ts
import { FFmpeg } from "@ffmpeg/ffmpeg";
var Transcoder = class {
  ffmpeg;
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
};
export {
  Transcoder
};
