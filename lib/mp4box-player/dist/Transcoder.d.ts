export class Transcoder {
    constructor(config: any);
    isReady: boolean;
    defaultConfig: {
        enableLogs: boolean;
        dist: string;
        enableMultiThreading: boolean;
    };
    cfg: {
        enableLogs: boolean;
        dist: string;
        enableMultiThreading: boolean;
    };
    ffmpeg: FFmpeg;
    load: () => Promise<void>;
    transcode: ({ input, ext, id, timeout }: {
        input: any;
        ext: any;
        id?: string;
        timeout: any;
    }) => Promise<import("@ffmpeg/ffmpeg/dist/esm/types").FileData>;
}
import { FFmpeg } from "@ffmpeg/ffmpeg";
