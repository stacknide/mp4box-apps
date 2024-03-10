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
    inputFormat: null;
    setInputFormat: (format: any) => any;
    transcode: ({ input, id, timeout, signal }: {
        input: any;
        id?: string | undefined;
        timeout: any;
        signal: any;
    }) => Promise<import("@ffmpeg/ffmpeg/dist/esm/types").FileData>;
}
import { FFmpeg } from "@ffmpeg/ffmpeg";
