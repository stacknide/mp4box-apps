import {
  DataStream,
  Log,
  // Textin4Parser,
  // VTTin4Parser,
  // XMLSubtitlein4Parser,
  MP4Box,
} from "@knide/mp4box";
import type { ISOFile } from "@knide/mp4box";
import { Downloader } from "./Downloader";
import type {
  Mp4boxVideoElement,
  Mp4boxMediaSource,
  Mp4boxMovieInfo,
  TConfig,
  TOnError,
  TOnErrorCallback,
  TOnMovieInfo,
  TOnMovieInfoCallback,
  TOnStatusChange,
  TOnStatusChangeCallback,
  TOnTrackInfo,
  TOnTrackInfoCallback,
  TMovieInfo,
  TTrackInfo,
  Mp4boxSourceBuffer,
  TrackKey,
  PlayerControls,
} from "./types";

const defaultConfig: TConfig = {
  url: "",
  segmentSize: 1000,
  chunkSize: 1000000,
  chunkTimeout: 500,
  extractionSize: 1,
  saveBuffer: false,
};

export class Mp4boxPlayer {
  private config: TConfig = defaultConfig;
  private mp4boxfile: ISOFile;
  private movieInfo: Mp4boxMovieInfo | null;
  private video: Mp4boxVideoElement;
  private downloader;
  private autoplay;
  private shouldSaveBuffers = false;
  private onStatusChangeCallback: TOnStatusChangeCallback | null;
  private onMovieInfoCallback: TOnMovieInfoCallback | null;
  private onTrackInfoCallback: TOnTrackInfoCallback | null;
  private onErrorCallback: TOnErrorCallback | null;
  private SHOW_LOGS = false;

  constructor(
    videoElement: HTMLVideoElement,
    initialDownloadConfig: TConfig | {} = {},
    downloaderInstance: Downloader
  ) {
    this.config = { ...defaultConfig, ...initialDownloadConfig };

    this.mp4boxfile = MP4Box.createFile();
    this.movieInfo = null;

    if (!videoElement) throw new Error("No video element provided");
    this.video = videoElement;

    this.downloader = downloaderInstance || new Downloader(videoElement);
    // this.downloader.setDownloadTimeoutCallback = this.setDownloadTimeout; // TODO: Find usage in this class?
    this.autoplay = false;

    // if (document.readyState !== 'complete')  ....
    // this.overlayTracks = document.getElementById("overlayTracks"); // TODO: No subtitle support for now
    this.shouldSaveBuffers = this.config.saveBuffer === true;

    /** @private Only onStatusChange is callable */
    this.onStatusChangeCallback = null;
    /** @private Only onMovieInfo is callable */
    this.onMovieInfoCallback = null;
    /** @private Only onTrackInfo is callable */
    this.onTrackInfoCallback = null;
    /** @private Only onError is callable */
    this.onErrorCallback = null;

    this.SHOW_LOGS = false;

    this.onWindowLoad();
  }

  /* Callback START */
  showLogs = (shouldShowLogs: boolean) => {
    this.SHOW_LOGS = shouldShowLogs;
  };

  onStatusChange: TOnStatusChange = (callback) => {
    this.onStatusChangeCallback = callback;
  };

  onMovieInfo: TOnMovieInfo = (callback) => {
    this.onMovieInfoCallback = callback;
  };

  onTrackInfo: TOnTrackInfo = (callback) => {
    this.onTrackInfoCallback = callback;
  };

  onError: TOnError = (callback) => {
    this.onErrorCallback = callback;
  };
  /* Callback END */

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

  /* Video Event Listeners START */
  addVideoEventListeners = () => {
    this.SHOW_LOGS && console.log("addVideoEventListeners");
    this.video.addEventListener("seeking", this.onSeeking.bind(this));
    this.video.addEventListener("playing", this.onPlaying.bind(this));
  };

  removeVideoEventListeners = () => {
    this.SHOW_LOGS && console.log("removeVideoEventListeners");
    this.video.removeEventListener("seeking", this.onSeeking);
    this.video.removeEventListener("playing", this.onPlaying);
  };

  onPlaying = (e: Event) => {
    this.SHOW_LOGS && console.log("onPlaying");
    this.video.playing = true;
    // if (this.video.onPlayCue) {
    //   this.processInbandCue.call(this.video.onPlayCue);
    //   this.video.onPlayCue = null;
    // }
  };

  onSeeking(e: Event) {
    this.SHOW_LOGS && console.log("onSeeking");

    var i, start, end;
    var seek_info;
    if (this.video.lastSeekTime !== this.video.currentTime) {
      for (i = 0; i < this.video.buffered.length; i++) {
        start = this.video.buffered.start(i);
        end = this.video.buffered.end(i);
        if (this.video.currentTime >= start && this.video.currentTime <= end) {
          return;
        }
      }
      /* Chrome fires twice the seeking event with the same value */
      Log.info(
        "Application",
        "Seeking called to video time " +
          Log.getDurationString(this.video.currentTime)
      );
      this.downloader.stop();
      this.resetCues();

      if (!this.mp4boxfile) return console.error("mp4boxfile not initialized");
      seek_info = this.mp4boxfile.seek(this.video.currentTime, true);
      this.downloader.setChunkStart(seek_info.offset);
      this.downloader.resume();
      this.onStatusChangeCallback?.("start", false);
      this.onStatusChangeCallback?.("stop", true);
      this.video.lastSeekTime = this.video.currentTime;
    }
  }
  /* Video Event Listeners END */

  resetCues = () => {
    this.SHOW_LOGS && console.log("resetCues");
    /** // TODO: miss::subtitles 
    for (var i = 0; i < this.video.textTracks.length; i++) {
      var texttrack = this.video.textTracks[i];
      while (texttrack.cues.length > 0) {
        texttrack.removeCue(texttrack.cues[0]);
      }
    }
    */
  };

  onWindowLoad = () => {
    this.SHOW_LOGS && console.log("onWindowLoad");
    // TODO: If !video ...
    this.video.addEventListener("error", (e) => {
      Log.error("Video error", e);
      this.onErrorCallback?.("Video error", e);
    });
    this.video.playing = false;

    /*	video.addEventListener("suspend", function(e) { 
          Log.info("Suspend event,");
          video.playing = false;
        });
        video.addEventListener("stalled", function(e) { 
          Log.info(("Stalled event,");
          video.playing = false;
        });
        video.addEventListener("waiting", function(e) { 
          Log.info(("Waiting event,");
          video.playing = false;
        });
    */

    /** // TODO: these tracks are arrays as per generateTrackInfo but why does it has onchange?  
    if (this.video.videoTracks)
      this.video.videoTracks.onchange = this.generateTrackInfo;
    if (this.video.audioTracks)
      this.video.audioTracks.onchange = this.generateTrackInfo;
    if (this.video.textTracks)
      this.video.textTracks.onchange = this.generateTrackInfo;
    */
    this.reset();

    /* Loading Track Viewers 
    var s = document.createElement("script");
    s.src = "trackviewers/fancyLyrics/viewer.js";
    s.async = false;
    document.head.appendChild(s);
    s = document.createElement("script");
    s.src = "trackviewers/musicbeats/viewer.js";
    s.async = false;
    document.head.appendChild(s);
    s = document.createElement("script");
    s.src = "trackviewers/gps/altitude.js";
    s.async = false;
    document.head.appendChild(s);
    s = document.createElement("script");
    s.src = "trackviewers/gps/position.js";
    s.async = false;
    document.head.appendChild(s);
    */
  };

  /* Reset START */
  reset = () => {
    this.SHOW_LOGS && console.log("reset");
    this.stop();
    this.downloader.reset();
    this.onStatusChangeCallback?.("start", false);
    this.resetMediaSource();
    this.removeVideoEventListeners();
    this.resetDisplay();
  };

  /* Functions to generate the tables displaying file information */
  resetDisplay = () => {
    this.SHOW_LOGS && console.log("resetDisplay");
    // this.overlayTracks.innerHTML = ""; // TODO: miss::subtitles
    //video.poster = '';
    //video.playing = false;
  };

  /* main functions, MSE-related */
  resetMediaSource = () => {
    this.SHOW_LOGS && console.log("resetMediaSource");
    if (this.video.ms) return;

    let mediaSource: Mp4boxMediaSource = new MediaSource();
    mediaSource.video = this.video;
    this.video.ms = mediaSource;
    mediaSource.addEventListener("sourceopen", this.onSourceOpen);
    mediaSource.addEventListener("sourceclose", this.onSourceClose);
    this.video.src = window.URL.createObjectURL(mediaSource);
    /* TODO: cannot remove Text tracks! Turning them off for now*/
    for (var i = 0; i < this.video.textTracks.length; i++) {
      var tt = this.video.textTracks[i];
      if (!tt) continue;
      tt.mode = "disabled";
    }
  };

  onSourceClose = (e: Event) => {
    this.SHOW_LOGS && console.log("onSourceClose");
    var ms = e.target as Mp4boxMediaSource;
    if (ms.video?.error) {
      // TODO:
      Log.error("MSE", "Source closed, video error: " + ms.video.error.code);
      this.onErrorCallback?.(
        `MSE, Source closed, video error`,
        ms.video?.error
      );
    } else {
      Log.info("MSE", "Source closed, no error");
    }
  };

  onSourceOpen = (e: Event) => {
    this.SHOW_LOGS && console.log("onSourceOpen");
    var ms = e.target;
    Log.info("MSE", "Source opened");
    Log.debug("MSE", ms);
  };
  /* Reset END */

  stop = () => {
    this.SHOW_LOGS && console.log("stop - Stopping downloader");
    if (!this.downloader.isStopped()) {
      this.onStatusChangeCallback?.("stop", false);
      this.onStatusChangeCallback?.("start", true);
      this.downloader.stop();
    }
  };

  play = () => {
    this.SHOW_LOGS && console.log("play");
    this.onStatusChangeCallback?.("play", false);
    this.autoplay = true;
    this.video.play();
    this.load();
  };

  /* Load START */
  load = () => {
    this.SHOW_LOGS && console.log("load");

    const ms = this.video.ms;
    if (!ms || ms.readyState !== "open") {
      return;
    }

    this.mp4boxfile = MP4Box.createFile();
    if (!this.mp4boxfile) throw new Error("mp4boxfile ISOFile not created");

    this.addVideoEventListeners();
    this.mp4boxfile.onMoovStart = () => {
      Log.info("Application", "Starting to parse movie information");
    };
    this.mp4boxfile.onReady = (info: Mp4boxMovieInfo) => {
      Log.info("Application", "Movie information received");
      this.movieInfo = info;
      if (info.isFragmented) {
        ms.duration = info.fragment_duration / info.timescale;
      } else {
        ms.duration = info.duration / info.timescale;
      }
      this.generateMovieInfo(info);
      this.addSourceBufferListener(info);
      this.stop();
      if (this.autoplay) {
        this.initializeAllSourceBuffers();
      } else {
        this.onStatusChangeCallback?.("initializeAllSourceBuffers", true);
      }
    };
    this.mp4boxfile.onSidx = (sidx) => {
      this.SHOW_LOGS && console.log(sidx);
    };
    const player = this;
    this.mp4boxfile.onItem = function (item) {
      var metaHandler = this.getMetaHandler();
      if (metaHandler.startsWith("mif1")) {
        var pitem = this.getPrimaryItem();
        player.SHOW_LOGS &&
          console.log("Found primary item in MP4 of type " + item.content_type);
        if (pitem.id === item.id) {
          player.video.poster = //
            window.URL.createObjectURL(new Blob([item.data.buffer]));
        }
      }
    };
    this.mp4boxfile.onSegment = (id, user, buffer, sampleNum, is_last) => {
      var sb = user;
      this.saveBuffer(buffer, `track-${id}-segment-${sb.segmentIndex}.m4s`);
      if (sb.segmentIndex !== undefined) sb.segmentIndex++;
      sb.pendingAppends?.push({ id, buffer, sampleNum, is_last });
      const message = `Received new segment for track ${id} up to sample #${sampleNum}, segments pending append: ${sb.pendingAppends?.length}`;
      Log.info("Application", message);
      this.onUpdateEnd(sb, true, false);
    };
    /**
    this.mp4boxfile.onSamples = (id, user, samples) => {
      var sampleParser;
      var cue;
      var texttrack = user;
      Log.info(`TextTrack #${id}`, `Received ${samples.length} new sample(s)`);
      for (var j = 0; j < samples.length; j++) {
        var sample = samples[j];
        if (sample.description.type === "wvtt") {
          sampleParser = new VTTin4Parser();
          var cues = sampleParser.parseSample(sample.data);
          for (var i = 0; i < cues.length; i++) {
            var cueIn4 = cues[i];
            cue = new VTTCue(
              sample.dts / sample.timescale,
              (sample.dts + sample.duration) / sample.timescale,
              cueIn4.payl ? cueIn4.payl.text : ""
            );
            texttrack.addCue(cue);
          }
        } else if (
          sample.description.type === "metx" ||
          sample.description.type === "stpp"
        ) {
          sampleParser = new XMLSubtitlein4Parser();
          var xmlSubSample = sampleParser.parseSample(sample);
          this.SHOW_LOGS &&
            console.log(
              "Parsed XML sample at time " +
                Log.getDurationString(sample.dts, sample.timescale) +
                " :",
              xmlSubSample.document
            );
          cue = new VTTCue(
            sample.dts / sample.timescale,
            (sample.dts + sample.duration) / sample.timescale,
            xmlSubSample.documentString
          );
          texttrack.addCue(cue);
          cue.is_sync = sample.is_sync;
          cue.onenter = this.processInbandCue;
        } else if (
          sample.description.type === "mett" ||
          sample.description.type === "sbtt" ||
          sample.description.type === "stxt"
        ) {
          sampleParser = new Textin4Parser();
          if (sample.description.txtC && j === 0) {
            if (sample.description.txtC.config) {
            } else {
              sample.description.txtC.config = sampleParser.parseConfig(
                sample.description.txtC.data
              );
            }
            this.SHOW_LOGS &&
              console.log(
                "Parser Configuration: ",
                sample.description.txtC.config
              );
            texttrack.config = sample.description.txtC.config;
          }
          var textSample = sampleParser.parseSample(sample);
          this.SHOW_LOGS &&
            console.log(
              "Parsed text sample at time " +
                Log.getDurationString(sample.dts, sample.timescale) +
                " :",
              textSample
            );
          cue = new VTTCue(
            sample.dts / sample.timescale,
            (sample.dts + sample.duration) / sample.timescale,
            textSample
          );
          texttrack.addCue(cue);
          cue.is_sync = sample.is_sync;
          cue.onenter = this.processInbandCue;
        }
      }
    };
    */
    this.onStatusChangeCallback?.("load", false);
    this.onStatusChangeCallback?.("start", false);
    this.onStatusChangeCallback?.("stop", true);

    this.downloader.setCallback((buffer, end, error) => {
      var nextStart = 0;
      if (buffer) {
        var progressVal = Math.ceil(
          100 * (this.downloader.chunkStart / this.downloader.totalLength)
        );
        this.onStatusChangeCallback?.("progress", progressVal);
        Log.info("Progress", `${progressVal}%`);
        if (!this.mp4boxfile) {
          console.error("Cannot appendBuffer. mp4boxfile not initialized!");
          return;
        }
        nextStart = this.mp4boxfile.appendBuffer(buffer, end);
      }
      if (end) {
        Log.info("Progress", "100%");
        this.onStatusChangeCallback?.("progress", 100);
        this.mp4boxfile.flush();
      } else {
        this.downloader.setChunkStart(nextStart);
      }
      if (error) {
        this.reset();
        this.onErrorCallback?.(
          "Download error",
          error,
          `EOF: ${end}, Buffer: ${buffer}`
        );
        Log.error("Progress", "Download error!");
      }
    });
    this.downloader.setInterval(this.config.chunkTimeout); // TODO:
    this.downloader.setChunkSize(this.config.chunkSize);
    if (!this.config.url) Log.warn("No Video URL specified!");
    this.downloader.setUrl(this.config.url || "");
    this.onStatusChangeCallback?.("load", false);
    this.downloader.start();
  };

  initializeAllSourceBuffers = () => {
    this.SHOW_LOGS && console.log("Initializing all source buffers");
    if (this.movieInfo) {
      var info = this.movieInfo;
      for (var i = 0; i < info.tracks.length; i++) {
        var track = info.tracks[i];
        if (!track) continue;
        this.addBuffer(this.video, track);
        // var checkBox = document.getElementById("addTrack" + track.id); // TODO: miss
        // checkBox.checked = true;
      }
      this.initializeSourceBuffers();
    }
  };

  initializeSourceBuffers = () => {
    this.SHOW_LOGS && console.log("Initializing source buffers");
    if (!this.mp4boxfile)
      throw new Error(
        "Cannot initializeSourceBuffers. mp4boxfile not initialized"
      );
    var initSegs = this.mp4boxfile.initializeSegmentation();
    for (var i = 0; i < initSegs.length; i++) {
      const initSeg = initSegs[i];
      if (!initSeg) continue;
      var sb = initSeg.user;
      if (!sb.ms)
        return console.error("Cannot initializeSourceBuffers. sb.ms is", sb.ms);

      if (i === 0) {
        sb.ms.pendingInits = 0;
      }
      sb.addEventListener("updateend", (e) => this.onInitAppended.bind(this));
      Log.info(`MSE - SourceBuffer #${sb.id}`, "Appending initialization data");
      sb.appendBuffer(initSeg.buffer);
      this.saveBuffer(initSeg.buffer, `track-${initSeg.id}-init.mp4`);
      sb.segmentIndex = 0;
      if (sb.ms.pendingInits !== undefined) sb.ms.pendingInits++;
    }
    this.onStatusChangeCallback?.("initializeAllSourceBuffers", false);
    this.onStatusChangeCallback?.("initializeSourceBuffers", false);
  };
  /* Load END */

  /* SB Append START */
  onInitAppended(e: Event) {
    this.SHOW_LOGS && console.log("onInitAppended");
    var sb = e.target as Mp4boxSourceBuffer;
    if (sb.ms?.readyState === "open") {
      this.updateBufferedString(sb, "Init segment append ended");
      sb.sampleNum = 0;
      sb.removeEventListener("updateend", (e) => this.onInitAppended(e));
      sb.addEventListener(
        "updateend",
        this.onUpdateEnd.bind(this, sb, true, true)
      );
      /* In case there are already pending buffers we call onUpdateEnd to start appending them*/
      this.onUpdateEnd(sb, false, true);

      if (sb.ms?.pendingInits === undefined) return;
      sb.ms.pendingInits--;
      if (this.autoplay && sb.ms.pendingInits === 0) {
        this.start();
      }
    }
  }

  start = () => {
    this.SHOW_LOGS && console.log("Start");
    this.onStatusChangeCallback?.("start", false);
    this.onStatusChangeCallback?.("stop", true);
    this.downloader.setChunkStart(this.mp4boxfile.seek(0, true).offset);
    this.downloader.setChunkSize(this.config.chunkSize); // TODO
    this.downloader.setInterval(this.config.chunkTimeout);

    if (!this.mp4boxfile) throw Error("mp4boxfile not initialized");
    this.mp4boxfile.start();

    this.downloader.resume();
  };

  onUpdateEnd(
    sb: Mp4boxSourceBuffer,
    isNotInit: boolean,
    isEndOfAppend: boolean
  ) {
    this.SHOW_LOGS &&
      console.log(
        "onUpdateEnd",
        sb.id,
        sb.ms?.readyState,
        sb.updating,
        sb.pendingAppends?.length,
        sb.segmentIndex
      );
    if (isEndOfAppend === true) {
      if (isNotInit === true) {
        this.updateBufferedString(sb, "Update ended");
      }
      if (sb.sampleNum) {
        this.mp4boxfile.releaseUsedSamples(sb.id, sb.sampleNum);
        delete sb.sampleNum;
      }
      if (sb.is_last) {
        try {
          if (sb.ms?.readyState === "open" && !sb.updating) sb.ms.endOfStream();
        } catch (e: any) {
          const errId = `MSE - SourceBuffer #${sb.id}`;
          Log.error(errId, e);
          this.onErrorCallback?.(errId, e, sb);
        }
      }
    }
    if (
      sb.ms?.readyState === "open" &&
      sb.updating === false &&
      typeof sb.pendingAppends !== "undefined" &&
      sb.pendingAppends.length > 0
    ) {
      var obj = sb.pendingAppends.shift();
      Log.info(
        `MSE - SourceBuffer #${sb.id}`,
        `Appending new buffer, pending: ${sb.pendingAppends.length}`
      );
      if (!obj) return console.error("obj is null");
      sb.sampleNum = obj.sampleNum;
      sb.is_last = obj.is_last;
      sb.appendBuffer(obj.buffer);
    }
  }

  updateBufferedString = (sb: Mp4boxSourceBuffer, string: string) => {
    if (!sb.ms)
      return console.error("Cannot updateBufferedString. sb.ms is", sb.ms);
    this.SHOW_LOGS &&
      console.log("updateBufferedString", sb.id, sb.ms.readyState);
    var rangeString;
    if (sb.ms.readyState === "open") {
      rangeString = Log.printRanges(sb.buffered);
      const currTime = Log.getDurationString(this.video.currentTime, 1);
      Log.info(
        `MSE - SourceBuffer #${sb.id}`,
        `${string}, updating: ${sb.updating}, currentTime: ${currTime}, buffered: ${rangeString}, pending: ${sb.pendingAppends?.length}`
      );
      // if (sb.bufferTd === undefined) { // TODO: miss
      //   sb.bufferTd = document.getElementById("buffer" + sb.id);
      // }
      // sb.bufferTd.textContent = rangeString;
    }
  };
  /* SB Append END */

  /* Buffer Management START */
  setShouldSaveBuffers = (shouldSaveBuffers: boolean) => {
    this.shouldSaveBuffers = shouldSaveBuffers;
  };
  saveBuffer = (buffer: Buffer, fileName: string) => {
    this.SHOW_LOGS && console.log("saveBuffer", fileName);
    if (this.shouldSaveBuffers) {
      var d = new DataStream(buffer);
      d.save(fileName);
    }
  };

  addSourceBufferListener = (info: Mp4boxMovieInfo) => {
    this.SHOW_LOGS && console.log("addSourceBufferListener");
    // for (var i = 0; i < info.tracks.length; i++) {
    //   var track = info.tracks[i];
    //   var checkBox = document.getElementById("addTrack" + track.id);
    //   if (!checkBox) continue;
    //   checkBox.addEventListener(
    //     "change",
    //     ((t) => (e) => {
    //       var check = e.target;
    //       if (check.checked) {
    //         this.addBuffer(this.video, t);
    //         this.onStatusChangeCallback?.("initializeSourceBuffers", true);
    //         this.onStatusChangeCallback?.("initializeAllSourceBuffers", false);
    //       } else {
    //         const isDisabled = this.removeBuffer(this.video, t.id);
    //         this.onStatusChangeCallback?.(
    //           "initializeSourceBuffers",
    //           !isDisabled
    //         );
    //         this.onStatusChangeCallback?.(
    //           "initializeAllSourceBuffers",
    //           !isDisabled
    //         );
    //       }
    //     })(track)
    //   );
    // }
  };

  addBuffer = (
    video: Mp4boxVideoElement,
    mp4track: Mp4boxMovieInfo["tracks"][number]
  ) => {
    this.SHOW_LOGS && console.log("addBuffer", mp4track.id);
    var sb: Mp4boxSourceBuffer;
    var ms = video.ms;
    if (!ms) return console.error(`Cannot addBuffer. video.ms is ${ms}`);
    var track_id = mp4track.id;
    var codec = mp4track.codec;
    var mime = 'video/mp4; codecs="' + codec + '"';
    var kind = mp4track.kind;
    // var trackDefault;
    // var trackDefaultSupport = typeof TrackDefault !== "undefined"; // TODO:
    var html5TrackKind = "";
    if (codec == "wvtt") {
      if (!kind.schemeURI.startsWith("urn:gpac:")) {
        html5TrackKind = "subtitles";
      } else {
        html5TrackKind = "metadata";
      }
    } else {
      if (kind && kind.schemeURI === "urn:w3c:html5:kind") {
        html5TrackKind = kind.value || "";
      }
    }
    // if (trackDefaultSupport) {
    //   // TODO:
    //   if (mp4track.type === "video" || mp4track.type === "audio") {
    //     trackDefault = new TrackDefault(
    //       mp4track.type,
    //       mp4track.language,
    //       mp4track.name,
    //       [html5TrackKind],
    //       track_id
    //     );
    //   } else {
    //     trackDefault = new TrackDefault(
    //       "text",
    //       mp4track.language,
    //       mp4track.name,
    //       [html5TrackKind],
    //       track_id
    //     );
    //   }
    // }
    if (MediaSource.isTypeSupported(mime)) {
      try {
        Log.info(
          `MSE - SourceBuffer #${track_id}`,
          `Creation with type "${mime}"`
        );
        sb = ms.addSourceBuffer(mime);
        // if (trackDefaultSupport) {
        //   // TODO:
        //   sb.trackDefaults = new TrackDefaultList([trackDefault]);
        // }
        const player = this;
        sb.addEventListener("error", function (e) {
          const errId = `MSE - SourceBuffer #${track_id}`;
          Log.error(errId, e);
          player.onErrorCallback?.(errId, e);
        });
        sb.ms = ms;
        sb.id = track_id;
        this.mp4boxfile.setSegmentOptions(track_id, sb, {
          nbSamples: this.config.segmentSize,
        }); // TODO:
        sb.pendingAppends = [];
      } catch (e: any) {
        const errId = `MSE SourceBuffer #${track_id}`;
        const message = `Cannot create buffer with type '${mime}'`;
        Log.error(errId, message, e);
        this.onErrorCallback?.(errId, e, message);
      }
    } else {
      Log.warn(
        "MSE",
        "MIME type '" +
          mime +
          "' not supported for creation of a SourceBuffer for track id " +
          track_id
      );
      // TODO: miss::subtitles
      // var i;
      // let foundTextTrack = false;
      // for (i = 0; i < video.textTracks.length; i++) {
      //   var track = video.textTracks[i];
      //   if (track.label === "track_" + track_id) {
      //     track.mode = "showing";
      //     track.div.style.display = "inline";
      //     foundTextTrack = true;
      //     break;
      //   }
      // }
      // if (!foundTextTrack && html5TrackKind !== "") {
      //   var texttrack = video.addTextTrack(
      //     html5TrackKind,
      //     mp4track.name,
      //     mp4track.language
      //   );
      //   texttrack.id = track_id;
      //   texttrack.mode = "showing";
      //   this.mp4boxfile.setExtractionOptions(track_id, texttrack, {
      //     nbSamples: this.config.extractionSize,
      //   });
      //   texttrack.codec = codec;
      //   texttrack.mime = codec.substring(codec.indexOf(".") + 1);
      //   texttrack.mp4kind = mp4track.kind;
      //   texttrack.track_id = track_id;
      //   var div = document.createElement("div");
      //   div.id = "overlay_track_" + track_id;
      //   div.setAttribute("class", "overlay");
      //   this.overlayTracks.appendChild(div); // TODO
      //   texttrack.div = div;
      //   this.initTrackViewer(texttrack);
      // }
    }
  };

  removeBuffer = (video: Mp4boxVideoElement, track_id: string) => {
    this.SHOW_LOGS && console.log("removeBuffer", track_id);
    var i;
    var sb: Mp4boxSourceBuffer | undefined;
    var ms = video.ms;
    if (!ms) {
      console.error("Cannot removeBuffer: ms is null");
      return false;
    }
    Log.info(`MSE - SourceBuffer #${track_id}`, "Removing buffer");
    var foundSb = false;
    for (i = 0; i < ms.sourceBuffers.length; i++) {
      sb = ms.sourceBuffers[i];
      if (!sb) {
        console.error("Cannot removeBuffer: sb is null", ms.sourceBuffers, i);
        continue;
      }
      if (sb.id == track_id) {
        ms.removeSourceBuffer(sb);
        this.mp4boxfile.unsetSegmentOptions(track_id);
        foundSb = true;
        break;
      }
    }
    if (!foundSb) {
      for (i = 0; i < video.textTracks.length; i++) {
        var track = video.textTracks[i];
        if (!track) continue;
        if (track.label === "track_" + track_id) {
          track.mode = "disabled";
          // track.div.style.display = "none"; // TODO miss::subtitles
          this.mp4boxfile.unsetExtractionOptions(track_id);
          break;
        }
      }
    }
    if (ms.sourceBuffers.length === 0) {
      return true;
    } else {
      return false;
    }
  };
  /* Buffer Management END */

  /* Subtitles START */
  initTrackViewer = (track: TextTrack) => {
    this.SHOW_LOGS && console.log("initTrackViewer", track.id);
    // TODO: miss::subtitles
    // if (track.mime === "image/x3d+xml" && typeof x3dom === "undefined") {
    //   var link = document.createElement("link");
    //   link.type = "text/css";
    //   link.rel = "stylesheet";
    //   link.href = "trackviewers/x3d/x3dom.css";
    //   document.head.appendChild(link);
    //   var s = document.createElement("script");
    //   s.async = true;
    //   s.type = "application/ecmascript";
    //   s.src = "trackviewers/x3d/x3dom.js";
    //   document.head.appendChild(s);
    // } else if (
    //   track.mp4kind.schemeURI === "urn:gpac:kinds" &&
    //   track.mp4kind.value === "gps"
    // ) {
    //   track.oncuechange = setupGpsTrackPositionViewer(track, track.div);
    // } else if (
    //   track.mp4kind.schemeURI === "urn:gpac:kinds" &&
    //   track.mp4kind.value === "beats"
    // ) {
    //   track.oncuechange = setupMusicBeatTrackViewer(track, track.div);
    // } else if (
    //   track.mp4kind.schemeURI === "urn:gpac:kinds" &&
    //   track.mp4kind.value === "lyrics"
    // ) {
    //   track.oncuechange = setupFancySubtitleTrackViewer(track, track.div);
    // }
  };
  /* Subtitles START */

  /**
   * Get player controls.
   * @returns {PlayerControls} - Player controls.
   */
  getControls(): PlayerControls {
    return {
      play: this.play,
      stop: this.stop,
      reset: this.reset,
      load: this.load,
      start: this.start,
      initializeAllSourceBuffers: this.initializeAllSourceBuffers,
      initializeSourceBuffers: this.initializeSourceBuffers,
    };
  }

  /** Info START */
  generateMovieInfo = (info: Mp4boxMovieInfo) => {
    const fileLength = this.downloader.getFileLength();
    const bitrate = Math.floor(
      (fileLength * 8 * info.timescale) / (info.duration * 1000)
    );

    const durationStr = (dur: number, timescale: number) =>
      timescale ? Log.getDurationString(dur, timescale) : ``;
    const actualTime =
      `${info.duration}/${info.timescale} ` +
      durationStr(info.duration, info.timescale);
    const fragDurationStr = //
      durationStr(info.fragment_duration, info.timescale);

    const movieInfo: TMovieInfo = {
      header: "Movie Info",
      fileLength: 0,
      tableRows: [
        {
          label: "File Size / Bitrate",
          value: `${fileLength} bytes / ${bitrate} kbps`,
        },
        { label: "Duration / Timescale", value: actualTime },
        { label: "Brands (major/compatible)", value: info.brands },
        { label: "MIME", value: info.mime },
        { label: "Progressive", value: info.isProgressive },
        { label: "Fragmented", value: info.isFragmented },
        { label: "MPEG-4 IOD", value: info.hasIOD },
        {
          label: "Fragmented duration",
          value:
            info.isFragmented && `${info.fragment_duration} ${fragDurationStr}`,
        },
        { label: "Creation Date", value: this.dateFmt(info.modified) },
        { label: "Last Modified", value: this.dateFmt(info.modified) },
      ],
      trackInfo: [],
      allInfo: info,
    };

    const trackTypes = ["Video", "Audio", "Subtitle", "Metadata", "Other"];
    for (const type of trackTypes) {
      const typeKey = `${type.toLowerCase()}Tracks` as TrackKey;
      if (info[typeKey]) {
        movieInfo.trackInfo.push({ type: type, tracks: info[typeKey] });
      }
    }

    this.onMovieInfoCallback?.(movieInfo);
  };

  /** Retrieves information about video, audio, and text tracks in HTML5 media element.*/
  generateTrackInfo(video: Mp4boxVideoElement) {
    const trackInfo: TTrackInfo = {
      videoTracks: [],
      audioTracks: [],
      textTracks: [],
    };

    if (video.videoTracks?.length) {
      for (let i = 0; i < video.videoTracks.length; i++) {
        const track = video.videoTracks[i];
        if (!track) continue;
        trackInfo.videoTracks.push({
          type: "video",
          id: track.id,
          kind: track.kind,
          label: track.label,
          language: track.language,
          selected: track.selected,
        });
      }
    }

    if (video.audioTracks?.length) {
      for (let i = 0; i < video.audioTracks.length; i++) {
        const track = video.audioTracks[i];
        if (!track) continue;
        trackInfo.audioTracks.push({
          type: "audio",
          id: track.id,
          kind: track.kind,
          label: track.label,
          language: track.language,
          enabled: track.enabled,
        });
      }
    }

    if (video.textTracks?.length) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (!track) continue;
        trackInfo.textTracks.push({
          id: track.id,
          type: "text",
          kind: track.kind,
          label: track.label,
          language: track.language,
          mode: track.mode,
        });
      }
    }

    this.onTrackInfoCallback?.(trackInfo);
  }

  /** Converts a date object to an object containing 'date' and 'time' properties.*/
  dateFmt(date: Date) {
    if (!date) return { date: "", time: "" };

    const formattedDate = {
      date: date.toISOString().slice(0, 10), // YYYY-MM-DD
      time: date.toTimeString().slice(0, 5), // hh:mm
    };

    return formattedDate;
  }
  /** Info END */
}
