/// <reference types="node" />
import { Downloader } from "./Downloader";
import type { Mp4boxVideoElement, Mp4boxMovieInfo, TConfig, TOnError, TOnMovieInfo, TOnStatusChange, TOnTrackInfo, Mp4boxSourceBuffer, PlayerControls } from "./types";
export declare class Mp4boxPlayer {
    private config;
    private mp4boxfile;
    private movieInfo;
    private video;
    private downloader;
    private autoplay;
    private shouldSaveBuffers;
    private onStatusChangeCallback;
    private onMovieInfoCallback;
    private onTrackInfoCallback;
    private onErrorCallback;
    private SHOW_LOGS;
    constructor(videoElement: HTMLVideoElement, initialDownloadConfig: {} | TConfig | undefined, downloaderInstance: Downloader);
    showLogs: (shouldShowLogs: boolean) => void;
    onStatusChange: TOnStatusChange;
    onMovieInfo: TOnMovieInfo;
    onTrackInfo: TOnTrackInfo;
    onError: TOnError;
    /** // TODO: miss::subtitiles
    processInbandCue = () => {
      this.SHOW_LOGS && console.log("processInbandCue");
      var content = "";
      if (this.video.playing === false) {
        this.video.onPlayCue = this;
        return;
      }
      if (this.is_sync & this.track.config) {
        content = this.track.config;
      }
      content += this.text;
      this.SHOW_LOGS &&
        console.log(
          "Video Time:",
          this.video.currentTime,
          "Processing cue for track " + this.track.track_id + " with:",
          content
        );
      // if (this.track.mime === "application/ecmascript") { // TODO: miss::subtitles
      //   var script = document.createElement("script");
      //   script.appendChild(document.createTextNode(content));
      //   this.track.div.appendChild(script);
      //   //this.track.div.innerHTML = "<script type='application/ecmascript'>"+content+"</script>";
      // } else if (this.track.mime === "text/css") {
      //   this.track.div.innerHTML = "<style>" + content + "</style>";
      // } else if (
      //   ["image/svg+xml", "text/html", "image/x3d+xml"].indexOf(this.track.mime) >
      //   -1
      // ) {
      //   // Presentable track
      //   this.track.div.innerHTML = content;
      //   if (this.track.mime === "image/x3d+xml") {
      //     if (typeof x3dom !== "undefined") {
      //       x3dom.reload();
      //     }
      //   }
      // } else {
      //   // Pure metadata track
      // }
    };
    */
    addVideoEventListeners: () => void;
    removeVideoEventListeners: () => void;
    onPlaying: (e: Event) => void;
    onSeeking(e: Event): void;
    resetCues: () => void;
    onWindowLoad: () => void;
    reset: () => void;
    resetDisplay: () => void;
    resetMediaSource: () => void;
    onSourceClose: (e: Event) => void;
    onSourceOpen: (e: Event) => void;
    stop: () => void;
    play: () => void;
    load: () => void;
    initializeAllSourceBuffers: () => void;
    initializeSourceBuffers: () => void;
    onInitAppended(e: Event): void;
    start: () => void;
    onUpdateEnd(sb: Mp4boxSourceBuffer, isNotInit: boolean, isEndOfAppend: boolean): void;
    updateBufferedString: (sb: Mp4boxSourceBuffer, string: string) => void;
    setShouldSaveBuffers: (shouldSaveBuffers: boolean) => void;
    saveBuffer: (buffer: Buffer, fileName: string) => void;
    addSourceBufferListener: (info: Mp4boxMovieInfo) => void;
    addBuffer: (video: Mp4boxVideoElement, mp4track: Mp4boxMovieInfo["tracks"][number]) => void;
    removeBuffer: (video: Mp4boxVideoElement, track_id: string) => boolean;
    initTrackViewer: (track: TextTrack) => void;
    /**
     * Get player controls.
     * @returns {PlayerControls} - Player controls.
     */
    getControls(): PlayerControls;
    /** Info START */
    generateMovieInfo: (info: Mp4boxMovieInfo) => void;
    /** Retrieves information about video, audio, and text tracks in HTML5 media element.*/
    generateTrackInfo(video: Mp4boxVideoElement): void;
    /** Converts a date object to an object containing 'date' and 'time' properties.*/
    dateFmt(date: Date): {
        date: string;
        time: string;
    };
}
