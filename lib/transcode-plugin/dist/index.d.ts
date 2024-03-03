import { FFmpeg } from '@ffmpeg/ffmpeg';

declare class Transcoder {
    ffmpeg: FFmpeg;
    constructor();
}

export { Transcoder };
