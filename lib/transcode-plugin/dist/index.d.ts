import { FFmpeg } from '@ffmpeg/ffmpeg';

type TDist = "umd" | "esm";
type TConfig = {
    enableLogs?: boolean;
    dist?: TDist;
    enableMultiThreading?: boolean;
};
type TTranscode = {
    buffer: Uint8Array | string;
    id: string;
    timeout?: number;
    ext?: string;
};
declare class Transcoder {
    ffmpeg: FFmpeg;
    private isReady;
    defaultConfig: TConfig;
    private cfg;
    constructor(config?: TConfig);
    load: () => Promise<void>;
    transcode: ({ buffer, ext, id, timeout }: TTranscode) => Promise<string | Uint8Array>;
}

export { Transcoder };
