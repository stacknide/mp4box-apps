export class Mp4boxPlayer {
    constructor(videoElement: any, initialDownloadConfig: any, downloaderInstance: any);
    config: any;
    videoFps: number;
    desiredChunkSize: number;
    SEGMENT_DURATION_SECS: number;
    video: any;
    downloader: any;
    autoplay: boolean;
    shouldSaveBuffers: any;
    /** @private Only onStatusChange is callable */
    private onStatusChangeCallback;
    /** @private Only onMovieInfo is callable */
    private onMovieInfoCallback;
    /** @private Only onTrackInfo is callable */
    private onTrackInfoCallback;
    /** @private Only onError is callable */
    private onErrorCallback;
    SHOW_LOGS: boolean;
    showLogs: (shouldShowLogs: any) => any;
    /**
     * @callback OnStatusChangeCallback
     * @param {string} controlName - Name of the control.
     * @param {any} status - Represents boolean for "enabled" status, number for "value" status, string for "text" status.
     */
    /** @param {OnStatusChangeCallback} callback - Called when the status of a control changes */
    onStatusChange: (callback: (controlName: string, status: any) => any) => void;
    /**
     * @callback OnInfoCallback
     * @param {Object} info
     */
    /** @param {OnInfoCallback} callback - Called when movieInfo is available */
    onMovieInfo: (callback: (info: Object) => any) => void;
    /** @param {OnInfoCallback} callback - Called when trackInfo is available */
    onTrackInfo: (callback: (info: Object) => any) => void;
    /**
     * @callback OnErrorCallback
     * @param {string} errorId - String identifier for the error.
     * @param {Object} error - Error object
     * @param {any} extraContext - Optional custom error message/data from Mp4boxPlayer.
     */
    /** @param {OnErrorCallback} callback - Called when the status of a control changes */
    onError: (callback: (errorId: string, error: Object, extraContext: any) => any) => void;
    processInbandCue: () => void;
    addVideoEventListeners: () => void;
    removeVideoEventListeners: () => void;
    onPlaying: (e: any) => void;
    onSeeking(e: any): void;
    resetCues: () => void;
    onWindowLoad: () => void;
    reset: () => void;
    resetDisplay: () => void;
    resetMediaSource: () => void;
    onSourceClose: (e: any) => void;
    onSourceOpen: (e: any) => void;
    stop: () => void;
    play: () => void;
    customDuration: null;
    setCustomDuration: (duration: any) => void;
    load: () => void;
    mp4boxfile: any;
    movieInfo: any;
    initializeAllSourceBuffers: () => void;
    initializeSourceBuffers: () => void;
    onInitAppended(e: any): void;
    start: () => void;
    onUpdateEnd(sb: any, isNotInit: any, isEndOfAppend: any): void;
    updateBufferedString: (sb: any, string: any) => void;
    setShouldSaveBuffers: (shouldSaveBuffers: any) => void;
    saveBuffer: (buffer: any, name: any) => void;
    addSourceBufferListener: (info: any) => void;
    addBuffer: (video: any, mp4track: any) => void;
    removeBuffer: (video: any, track_id: any) => boolean;
    initTrackViewer: (track: any) => void;
    /**
     * Get player controls.
     * @returns {PlayerControls} - Player controls.
     */
    getControls(): PlayerControls;
    /** Info START */
    generateMovieInfo: (info: any) => void;
    /**
     * Retrieves information about video, audio, and text tracks in HTML5 media element.
     * @returns {Object} - Object containing information about video, audio, and text tracks.
     */
    generateTrackInfo(video: any): Object;
    /**
     * Converts a date object to an object containing 'date' and 'time' properties.
     * @param {Date} date - a JS Date object instance
     * @returns {Object} - Object with 'date' and 'time' properties.
     */
    dateFmt(date: Date): Object;
}
export type PlayerControls = {
    /**
     * - Enters Playing state + Initializes the player.
     */
    play: Function;
    /**
     * - Stops downloading any more chunks.
     */
    stop: Function;
    /**
     * - Resets the player by reinitializing the MediaSource.
     */
    reset: Function;
    /**
     * - Initializes the player.
     */
    load: Function;
    /**
     * - Can only be used if the player has already been initialized.
     */
    start: Function;
    /**
     * - Adds new source buffers to the player + initializes the source buffers.
     */
    initializeAllSourceBuffers: Function;
    /**
     * - Only initializes the source buffers.
     */
    initializeSourceBuffers: Function;
};
/**
 * @typedef {Object} PlayerControls
 * @property {function} play - Enters Playing state + Initializes the player.
 * @property {function} stop - Stops downloading any more chunks.
 * @property {function} reset - Resets the player by reinitializing the MediaSource.
 * @property {function} load - Initializes the player.
 * @property {function} start - Can only be used if the player has already been initialized.
 * @property {function} initializeAllSourceBuffers - Adds new source buffers to the player + initializes the source buffers.
 * @property {function} initializeSourceBuffers - Only initializes the source buffers.
 */
/** @type {PlayerControls} */
export const PlayerControls: PlayerControls;
