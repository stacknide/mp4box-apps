import { type Mp4boxVideoElement } from "@knide/mp4box";
import type { TBufferFetcher, TDownloadTimeoutCallback, TOnDownloadCallback } from "./types";
export declare class Downloader {
    isActive: boolean;
    realtime: boolean;
    chunkStart: number;
    chunkSize: number;
    totalLength: number;
    customTotalLength: number;
    chunkTimeout: number;
    url: string;
    eof: boolean;
    private callback;
    private downloadTimeoutCallback;
    abortController: AbortController;
    ffmpeg: any;
    bufferFetcher: TBufferFetcher | null;
    videoElement: Mp4boxVideoElement;
    timeoutID?: number;
    constructor(videoElement: Mp4boxVideoElement, transcoder?: null);
    setDownloadTimeoutCallback: (callback: TDownloadTimeoutCallback) => this;
    reset: () => this;
    setRealTime: (_realtime: boolean) => this;
    setChunkSize: (_size: number) => this;
    setChunkStart: (_start: number) => this;
    setInterval: (_timeout: number) => this;
    setUrl: (_url: string) => this;
    setCallback: (_callback: TOnDownloadCallback) => this;
    isStopped: () => boolean;
    getFileLength: () => number;
    setCustomTotalLength: (customTotalLength: number) => void;
    /**
     * Sets a custom buffer fetcher function for range requests.
     *
     * @param {function} fetcher - A custom fetcher function for range requests.
     *   This function should accept parameters for start, end, abortSignal, and url.
     *   - {number} start - The start position for the range request.
     *   - {number} end - The end position for the range request.
     *   - {AbortSignal} abortSignal - An AbortSignal object that allows you to abort the fetch.
     *   The fetcher function is expected to return a Promise that resolves to the fetched data (e.g., ArrayBuffer and totalLength of video file. i.e. it will return {buffer, totalLength} object
     */
    setBufferFetcher: (fetcher: TBufferFetcher) => void;
    getFile: () => void;
    start: () => this;
    resume: () => this;
    stop: () => this;
    computeWaitingTimeFromBuffer(video: Mp4boxVideoElement): number;
}
