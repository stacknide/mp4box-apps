export class Downloader {
    constructor(videoElement: any, transcoder?: any);
    isActive: boolean;
    realtime: boolean;
    chunkStart: number;
    chunkSize: number;
    totalLength: number;
    customTotalLength: number;
    chunkTimeout: number;
    url: any;
    callback: any;
    eof: boolean;
    downloadTimeoutCallback: any;
    abortController: AbortController;
    bufferFetcher: Function;
    videoElement: any;
    transcoder: any;
    setDownloadTimeoutCallback: (callback: any) => this;
    reset: () => this;
    setRealTime: (_realtime: any) => this;
    setChunkSize: (_size: any) => this;
    setChunkStart: (_start: any) => this;
    setInterval: (_timeout: any) => this;
    setUrl: (_url: any) => this;
    setCallback: (_callback: any) => this;
    isStopped: () => boolean;
    getFileLength: () => number;
    setCustomTotalLength: (customTotalLength: any) => void;
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
    setBufferFetcher: (fetcher: Function) => void;
    getFile: () => void;
    start: () => this;
    resume: () => this;
    stop: () => this;
    computeWaitingTimeFromBuffer(video: any): number;
}
