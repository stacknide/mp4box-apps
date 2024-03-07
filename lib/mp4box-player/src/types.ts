import type {
  Mp4boxSourceBuffer as _SB,
  Mp4boxVideoElement as _VE,
  Mp4boxMediaSource as _MS,
} from "@knide/mp4box";

export type TConfig = {
  /** Video URL */
  url: string;
  /** The size of each segment. */
  segmentSize: number;
  /** The size of each chunk. */
  chunkSize: number;
  /** The timeout for chunk downloads. */
  chunkTimeout: number;
  /** The size for extraction. */
  extractionSize: number;
  /** Save the buffers to disk. */
  saveBuffer: boolean;
};

export interface PlayerControls {
  /** Enters Playing state + Initializes the player.*/
  play: Function;
  /** Stops downloading any more chunks. */
  stop: Function;
  /** Resets the player by reinitializing the MediaSource. */
  reset: Function;
  /** Initializes the player. */
  load: Function;
  /** Can only be used if the player has already been initialized. */
  start: Function;
  /** Adds new source buffers to the player + initializes the source buffers. */
  initializeAllSourceBuffers: Function;
  /** Only initializes the source buffers. */
  initializeSourceBuffers: Function;
}

interface BaseTrackInfo {
  id: string;
  kind: string;
  label: string;
  language: string;
}
interface VideoTrackInfo extends BaseTrackInfo {
  type: "video";
  selected: boolean;
}
interface AudioTrackInfo extends BaseTrackInfo {
  type: "audio";
  enabled: boolean;
}
interface TextTrackInfo extends BaseTrackInfo {
  type: "text";
  mode: string;
}
export type TTrackInfo = {
  videoTracks: VideoTrackInfo[];
  audioTracks: AudioTrackInfo[];
  textTracks: TextTrackInfo[];
};
export type TOnTrackInfoCallback = (info: TTrackInfo) => void;
export type TOnTrackInfo = (
  /** Called when trackInfo is available */
  callback: TOnTrackInfoCallback
) => void;

export type Mp4boxMovieInfo = {
  brands: string;
  mime: string;
  isProgressive: boolean;
  isFragmented: boolean;
  hasIOD: boolean;
  fragment_duration: number;
  timescale: number;
  duration: number;
  modified: Date;
  // TODO: add all properties that get logged out from mp4box's onMovieInfo. Replace any[]
  VideoTracks: any[];
  AudioTracks: any[];
  SubtitleTracks: any[];
  MetadataTracks: any[];
  OtherTracks: any[];
  tracks: {
    id: string;
    codec: string;
    kind: { schemeURI: string; value: string };
  }[];
};
const trackTypes = [
  "VideoTracks",
  "AudioTracks",
  "SubtitleTracks",
  "MetadataTracks",
  "OtherTracks",
] as const;
export type TrackKey = (typeof trackTypes)[number];
type FmtDate = { date: string; time: string };
export interface TMovieInfo {
  header: string;
  fileLength: number;
  tableRows: { label: string; value: string | boolean | number | FmtDate }[];
  trackInfo: { type: string; tracks: Mp4boxMovieInfo[TrackKey] }[];
  allInfo: Mp4boxMovieInfo;
}
export type TOnMovieInfoCallback = (info: TMovieInfo) => void;
export type TOnMovieInfo = (
  /** Called when movieInfo is available */
  callback: TOnMovieInfoCallback
) => void;

type TPlayerControlName = keyof PlayerControls;
type TStatusName = "progress";
export type TOnStatusChangeCallback = (
  /** Called when status is available */
  controlName: TPlayerControlName | TStatusName,
  /** Represents boolean for "enabled" status, number for "value" status, string for "text" status. */
  status: boolean | string | number
) => void;
export type TOnStatusChange = (
  /** Called when the status of a control changes */
  callback: TOnStatusChangeCallback
) => void;

export type TOnErrorCallback = (
  /** String identifier for the error */
  errorId: string,
  error: Error | ErrorEvent | MediaError | Event | boolean,
  /** Optional custom error message/data from Mp4boxPlayer */
  extraContext?: string | object
) => void;
export type TOnError = (
  /** Called when an error occurs */
  callback: TOnErrorCallback
) => void;

export type TShowLogs = (shouldShowLogs: boolean) => void;

export type Mp4boxSourceBuffer = _SB;
export type Mp4boxMediaSource = _MS;
export type Mp4boxVideoElement = _VE & {
  videoTracks?: VideoTrackInfo[];
  audioTracks?: AudioTrackInfo[];
};

/*************Downloader.js********************* */

export type TBufferFetcher = (
  start: number,
  end: number,
  signal: AbortSignal
) => Promise<{
  buffer: ArrayBuffer;
  totalLength: number;
}>;

export type TOnDownloadCallback = (
  buffer: ArrayBuffer | null,
  end: boolean,
  error?: boolean | Error
) => Promise<void> | void;

export type TDownloadTimeoutCallback = (timeoutDuration: number) => void;
