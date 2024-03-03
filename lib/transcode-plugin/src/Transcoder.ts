import { FFmpeg } from "@ffmpeg/ffmpeg";

export class Transcoder {
  public ffmpeg: FFmpeg;
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
}
