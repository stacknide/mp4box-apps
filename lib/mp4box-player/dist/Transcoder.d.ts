import { FFmpeg } from "@ffmpeg/ffmpeg";
type TDist = "umd" | "esm";
type TConfig = {
    enableLogs?: boolean;
    dist?: TDist;
    enableMultiThreading?: boolean;
};
export type TTranscodeOpts = {
    input: Uint8Array | string;
    id?: string;
    timeout?: number;
    ext: string;
};
export declare class Transcoder {
    ffmpeg: FFmpeg;
    private isReady;
    defaultConfig: TConfig;
    private cfg;
    constructor(config?: TConfig);
    load: () => Promise<void>;
    transcode: ({ input, ext, id, timeout, }: TTranscodeOpts) => Promise<string | Uint8Array>;
}
export {};
