'use strict';

var mp4box = require('@knide/mp4box');

class Downloader {
  constructor(videoElement, transcoder = null) {
    this.isActive = false;
    this.realtime = true;
    this.chunkStart = 0;
    this.chunkSize = 0;
    this.totalLength = 0;
    this.customTotalLength = 0;
    this.chunkTimeout = 1000;
    this.url = null;
    this.callback = null;
    this.eof = false;
    this.downloadTimeoutCallback = null;
    this.abortController = new AbortController();
    this.bufferFetcher = null;
    this.videoElement = videoElement;
    if (!this.videoElement)
      throw new Error("No video element provided to Downloader");

    if (transcoder) {
      this.ffmpeg = transcoder;
      transcoder.load();
    }
  }

  setDownloadTimeoutCallback = (callback) => {
    this.downloadTimeoutCallback = callback;
    return this;
  };

  reset = () => {
    this.chunkStart = 0;
    this.totalLength = 0;
    this.eof = false;
    return this;
  };

  setRealTime = (_realtime) => {
    this.realtime = _realtime;
    return this;
  };

  setChunkSize = (_size) => {
    this.chunkSize = _size;
    return this;
  };

  setChunkStart = (_start) => {
    this.chunkStart = _start;
    this.eof = false;
    return this;
  };

  setInterval = (_timeout) => {
    this.chunkTimeout = _timeout;
    return this;
  };

  setUrl = (_url) => {
    this.url = _url;
    return this;
  };

  setCallback = (_callback) => {
    this.callback = _callback;
    return this;
  };

  isStopped = () => {
    return !this.isActive;
  };

  getFileLength = () => {
    return this.totalLength;
  };

  setCustomTotalLength = (customTotalLength) => {
    this.customTotalLength = customTotalLength;
  };

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
  setBufferFetcher = (fetcher) => {
    this.bufferFetcher = fetcher;
  };

  getFile = () => {
    this.abortController?.abort();

    var dl = this;
    if (dl.totalLength && this.chunkStart >= dl.totalLength) {
      dl.eof = true;
    }
    if (dl.eof === true) {
      mp4box.Log.info("Downloader", "File download done.");
      this.callback(null, true);
      return;
    }

    const defaultBufferFetcher = (start, end, signal) => {
      var range = null;
      var maxRange;
      if (end < Infinity) {
        range = "bytes=" + start + "-";
        maxRange = end;

        // if the file length is known we limit the max range to that length
        // if (this.totalLength !== 0) {
        //   maxRange = Math.min(maxRange, this.totalLength);
        // }
        range += maxRange;
      }

      var options = { method: "GET", headers: { Range: range }, signal };

      return fetch(this.url, options).then(async function (response) {
        if (response.status == 404) {
          dl.callback(null, false, true);
        }

        if ([200, 206, 304, 416].includes(response.status)) {
          const rangeReceived = response.headers.get("Content-Range");
          if (!dl.totalLength && rangeReceived) {
            var sizeIndex;
            sizeIndex = rangeReceived.indexOf("/");
            if (sizeIndex > -1) {
              dl.totalLength = +rangeReceived.slice(sizeIndex + 1);
            }
          }

          const totalLength = dl.customTotalLength || dl.totalLength;
          return { buffer: await response.arrayBuffer(), totalLength };
        } else {
          throw new Error("HTTP Error " + response.status);
        }
      });
    };

    var controller = new AbortController();
    var signal = controller.signal;
    this.abortController = controller;

    const start = this.chunkStart;
    const end = start + this.chunkSize - 1;

    const bufferFetcherThenable = this.bufferFetcher
      ? this.bufferFetcher(start, end, signal)
      : defaultBufferFetcher(start, end, signal);

    bufferFetcherThenable
      .then(async function ({ buffer: buf, totalLength }) {
        let buffer = null;
        if (dl.ffmpeg) {
          const uInt8Arr = new Uint8Array(buf);
          const uInt8Output = //
            await dl.ffmpeg.transcode({ input: uInt8Arr, ext: "mp4" });
          buffer = uInt8Output.buffer;
        } else buffer = buf;

        if (totalLength) dl.totalLength = totalLength;
        else throw new Error("file byte length not available");

        mp4box.Log.info(
          "Downloader",
          "Received data range. ByteLength: " + buffer.byteLength
        );
        const endByte = start + buffer.byteLength - 1;
        dl.eof = endByte >= dl.totalLength;
        // dl.eof =
        // buffer.byteLength !== dl.chunkSize ||
        // buffer.byteLength === dl.totalLength
        if (dl.eof) {
          console.log(
            `EOF Reason: File Length reached, Last byte: ${endByte.toLocaleString()}, Total Length: ${dl.totalLength.toLocaleString()}`
          );
          // if (buffer.byteLength !== dl.chunkSize)
          //   console.log(
          //     `EOF Reason: Received Buffer length didn't match with Expected Buffer Length`,
          //     `Buffer Length: ${buffer.byteLength.toLocaleString()}, Expected Length: ${dl.chunkSize.toLocaleString()}, Total Length: ${dl.totalLength.toLocaleString()}`
          //   )
          // else if (buffer.byteLength === dl.totalLength)
          //   console.log(
          //     `EOF Reason: Total Length reached, Buffer Length: ${buffer.byteLength.toLocaleString()}, Expected Length: ${dl.totalLength.toLocaleString()}, Total Length: ${dl.totalLength.toLocaleString()}`
          //   )
        } else mp4box.Log.info(`EOF:${dl.eof}`, `Received Buffer Length: ${buffer.byteLength.toLocaleString()}, Expected Length: ${dl.chunkSize.toLocaleString()}, Total Length: ${dl.totalLength.toLocaleString()}`);

        buffer.fileStart = dl.chunkStart;

        if (!buffer.fileStart) {
          buffer = buffer.slice(0);
          buffer.fileStart = dl.chunkStart;
        }

        dl.callback(buffer, dl.eof);

        if (dl.isActive === true && dl.eof === false) {
          var timeoutDuration = 0;
          if (!dl.realtime) {
            timeoutDuration = dl.chunkTimeout;
          } else {
            timeoutDuration = dl.computeWaitingTimeFromBuffer(dl.videoElement);
          }
          if (dl.setDownloadTimeoutCallback)
            dl.setDownloadTimeoutCallback(timeoutDuration);

          mp4box.Log.info(
            "Downloader",
            "Next download scheduled in " + Math.floor(timeoutDuration) + " ms."
          );

          dl.timeoutID = window.setTimeout(
            dl.getFile.bind(dl),
            timeoutDuration
          );
        } else {
          dl.isActive = false;
        }
      })
      .catch(function (error) {
        if (error.name === "AbortError") {
          console.info("Range request aborted.");
        } else {
          dl.callback(null, false, error);
        }
      });
  };

  start = () => {
    mp4box.Log.info("Downloader", "Starting file download");
    this.chunkStart = 0;
    this.resume();
    return this;
  };

  resume = () => {
    mp4box.Log.info("Downloader", "Resuming file download");
    this.isActive = true;
    if (this.chunkSize === 0) {
      this.chunkSize = Infinity;
    }
    this.getFile();
    return this;
  };

  stop = () => {
    this.abortController?.abort();

    mp4box.Log.info("Downloader", "Stopping file download");
    this.isActive = false;
    if (this.timeoutID) {
      window.clearTimeout(this.timeoutID);
      delete this.timeoutID;
    }
    return this;
  };

  computeWaitingTimeFromBuffer(video) {
    var ms = video.ms;
    var sb;
    var startRange, endRange;
    var currentTime = video.currentTime;
    var playbackRate = video.playbackRate;
    var maxStartRange = 0;
    var minEndRange = Infinity;
    var ratio;
    var wait;
    var duration;
    /* computing the intersection of the buffered values of all active sourcebuffers around the current time, 
	   may already be done by the browser when calling video.buffered (to be checked: TODO) */
    for (var i = 0; i < ms.activeSourceBuffers.length; i++) {
      sb = ms.activeSourceBuffers[i];
      for (var j = 0; j < sb.buffered.length; j++) {
        startRange = sb.buffered.start(j);
        endRange = sb.buffered.end(j);
        if (currentTime >= startRange && currentTime <= endRange) {
          if (startRange >= maxStartRange) maxStartRange = startRange;
          if (endRange <= minEndRange) minEndRange = endRange;
          break;
        }
      }
    }
    if (minEndRange === Infinity) {
      minEndRange = 0;
    }
    duration = minEndRange - maxStartRange;
    ratio = (currentTime - maxStartRange) / duration;
    mp4box.Log.info(
      "Demo",
      "Playback position (" +
        mp4box.Log.getDurationString(currentTime) +
        ") in current buffer [" +
        mp4box.Log.getDurationString(maxStartRange) +
        "," +
        mp4box.Log.getDurationString(minEndRange) +
        "]: " +
        Math.floor(ratio * 100) +
        "%"
    );
    if (ratio >= 3 / (playbackRate + 3)) {
      mp4box.Log.info("Demo", "Downloading immediately new data!");
      // when the currentTime of the video is at more than 3/4 of the buffered range (for a playback rate of 1), immediately fetch a new buffer
      return 1; // return 1 ms (instead of 0) to be able to compute a non-infinite bitrate value
    } else {
      /* if not, wait for half (at playback rate of 1) of the remaining time in the buffer */
      wait = (1000 * (minEndRange - currentTime)) / (2 * playbackRate);
      mp4box.Log.info(
        "Demo",
        "Waiting for " +
          mp4box.Log.getDurationString(wait, 1000) +
          " s for the next download"
      );
      return wait;
    }
  }
}

class Mp4boxPlayer {
  constructor(videoElement, initialDownloadConfig, downloaderInstance) {
    this.config = {
      url: "", // Video URL
      segmentSize: 1000, // The size of each segment.
      chunkSize: 1000000, // The size of each chunk.
      chunkTimeout: 500, // The timeout for chunk downloads.
      extractionSize: 1, // The size for extraction.
      saveBuffer: false, // Save the buffers to disk.
      ...initialDownloadConfig,
    };

    this.mp4boxfile;
    this.movieInfo;

    // if !videoElement ...
    this.video = videoElement;

    this.downloader = downloaderInstance || new Downloader(videoElement);
    // this.downloader.setDownloadTimeoutCallback = this.setDownloadTimeout; // TODO: Find usage in this class?
    this.autoplay = false;

    // if (document.readyState !== 'complete')  ....
    // this.overlayTracks = document.getElementById("overlayTracks"); // TODO: No subtitle support for now
    this.shouldSaveBuffers = this.config.saveBuffer;

    /** @private Only onStatusChange is callable */
    this.onStatusChangeCallback = null;
    /** @private Only onMovieInfo is callable */
    this.onMovieInfoCallback = null;
    /** @private Only onTrackInfo is callable */
    this.onTrackInfoCallback = null;
    /** @private Only onError is callable */
    this.onErrorCallback = null;

    this.SHOW_LOGS = false;
    this.showLogs = (shouldShowLogs) => (this.SHOW_LOGS = shouldShowLogs);

    this.onWindowLoad();
  }

  /* Callback START */
  /**
   * @callback OnStatusChangeCallback
   * @param {string} controlName - Name of the control.
   * @param {any} status - Represents boolean for "enabled" status, number for "value" status, string for "text" status.
   */
  /** @param {OnStatusChangeCallback} callback - Called when the status of a control changes */
  onStatusChange = (callback) => {
    this.onStatusChangeCallback = callback;
  };

  /**
   * @callback OnInfoCallback
   * @param {Object} info
   */
  /** @param {OnInfoCallback} callback - Called when movieInfo is available */
  onMovieInfo = (callback) => {
    this.onMovieInfoCallback = callback;
  };

  /** @param {OnInfoCallback} callback - Called when trackInfo is available */
  onTrackInfo = (callback) => {
    this.onTrackInfoCallback = callback;
  };

  /**
   * @callback OnErrorCallback
   * @param {string} errorId - String identifier for the error.
   * @param {Object} error - Error object
   * @param {any} extraContext - Optional custom error message/data from Mp4boxPlayer.
   */
  /** @param {OnErrorCallback} callback - Called when the status of a control changes */
  onError = (callback) => {
    this.onErrorCallback = callback;
  };
  /* Callback END */

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
    //   /* Presentable track */
    //   this.track.div.innerHTML = content;
    //   if (this.track.mime === "image/x3d+xml") {
    //     if (typeof x3dom !== "undefined") {
    //       x3dom.reload();
    //     }
    //   }
    // } else {
    //   /* Pure metadata track */
    // }
  };

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

  onPlaying = (e) => {
    this.SHOW_LOGS && console.log("onPlaying");
    this.video.playing = true;
    if (this.video.onPlayCue) {
      this.processInbandCue.call(this.video.onPlayCue);
      this.video.onPlayCue = null;
    }
  };

  onSeeking(e) {
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
      mp4box.Log.info(
        "Application",
        "Seeking called to video time " +
          mp4box.Log.getDurationString(this.video.currentTime)
      );
      this.downloader.stop();
      this.resetCues();

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
    for (var i = 0; i < this.video.textTracks.length; i++) {
      var texttrack = this.video.textTracks[i];
      while (texttrack.cues.length > 0) {
        texttrack.removeCue(texttrack.cues[0]);
      }
    }
  };

  onWindowLoad = () => {
    this.SHOW_LOGS && console.log("onWindowLoad");
    // TODO: If !video ...
    this.video.addEventListener("error", (e) => {
      mp4box.Log.error("Video error", e);
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
    if (this.video.videoTracks)
      this.video.videoTracks.onchange = this.generateTrackInfo;
    if (this.video.audioTracks)
      this.video.audioTracks.onchange = this.generateTrackInfo;
    if (this.video.textTracks)
      this.video.textTracks.onchange = this.generateTrackInfo;
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

    var mediaSource;
    mediaSource = new MediaSource();
    mediaSource.video = this.video;
    this.video.ms = mediaSource;
    mediaSource.addEventListener("sourceopen", this.onSourceOpen);
    mediaSource.addEventListener("sourceclose", this.onSourceClose);
    this.video.src = window.URL.createObjectURL(mediaSource);
    /* TODO: cannot remove Text tracks! Turning them off for now*/
    for (var i = 0; i < this.video.textTracks.length; i++) {
      var tt = this.video.textTracks[i];
      tt.mode = "disabled";
    }
  };

  onSourceClose = (e) => {
    this.SHOW_LOGS && console.log("onSourceClose");
    var ms = e.target;
    if (ms.video.error) {
      // TODO:
      mp4box.Log.error("MSE", "Source closed, video error: " + ms.video.error.code);
      this.onErrorCallback?.(`MSE, Source closed, video error`, e);
    } else {
      mp4box.Log.info("MSE", "Source closed, no error");
    }
  };

  onSourceOpen = (e) => {
    this.SHOW_LOGS && console.log("onSourceOpen");
    var ms = e.target;
    mp4box.Log.info("MSE", "Source opened");
    mp4box.Log.debug("MSE", ms);
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
    var ms = this.video.ms;
    if (ms.readyState !== "open") {
      return;
    }

    this.mp4boxfile = mp4box.createFile();
    this.addVideoEventListeners();
    this.mp4boxfile.onMoovStart = () => {
      mp4box.Log.info("Application", "Starting to parse movie information");
    };
    this.mp4boxfile.onReady = (info) => {
      mp4box.Log.info("Application", "Movie information received");
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
    this.mp4boxfile.onItem = (item) => {
      var metaHandler = this.getMetaHandler();
      if (metaHandler.startsWith("mif1")) {
        var pitem = this.getPrimaryItem();
        this.SHOW_LOGS &&
          console.log("Found primary item in MP4 of type " + item.content_type);
        if (pitem.id === item.id) {
          this.video.poster = //
            window.URL.createObjectURL(new Blob([item.data.buffer]));
        }
      }
    };
    this.mp4boxfile.onSegment = (id, user, buffer, sampleNum, is_last) => {
      var sb = user;
      this.saveBuffer(buffer, `track-${id}-segment-${sb.segmentIndex}.m4s`);
      sb.segmentIndex++;
      sb.pendingAppends.push({ id, buffer, sampleNum, is_last });
      const message = `Received new segment for track ${id} up to sample #${sampleNum}, segments pending append: ${sb.pendingAppends.length}`;
      mp4box.Log.info("Application", message);
      this.onUpdateEnd(sb, true, false);
    };
    this.mp4boxfile.onSamples = (id, user, samples) => {
      var sampleParser;
      var cue;
      var texttrack = user;
      mp4box.Log.info(`TextTrack #${id}`, `Received ${samples.length} new sample(s)`);
      for (var j = 0; j < samples.length; j++) {
        var sample = samples[j];
        if (sample.description.type === "wvtt") {
          sampleParser = new mp4box.VTTin4Parser();
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
          sampleParser = new mp4box.XMLSubtitlein4Parser();
          var xmlSubSample = sampleParser.parseSample(sample);
          this.SHOW_LOGS &&
            console.log(
              "Parsed XML sample at time " +
                mp4box.Log.getDurationString(sample.dts, sample.timescale) +
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
          sampleParser = new mp4box.Textin4Parser();
          if (sample.description.txtC && j === 0) {
            if (sample.description.txtC.config) ; else {
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
                mp4box.Log.getDurationString(sample.dts, sample.timescale) +
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
        mp4box.Log.info("Progress", `${progressVal}%`);
        nextStart = this.mp4boxfile.appendBuffer(buffer, end);
      }
      if (end) {
        mp4box.Log.info("Progress", "100%");
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
        mp4box.Log.error("Progress", "Download error!");
      }
    });
    this.downloader.setInterval(this.config.chunkTimeout); // TODO:
    this.downloader.setChunkSize(this.config.chunkSize);
    if (!this.config.url) mp4box.Log.warn("No Video URL specified!");
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
        this.addBuffer(this.video, track);
        // var checkBox = document.getElementById("addTrack" + track.id); // TODO: miss
        // checkBox.checked = true;
      }
      this.initializeSourceBuffers();
    }
  };

  initializeSourceBuffers = () => {
    this.SHOW_LOGS && console.log("Initializing source buffers");
    var initSegs = this.mp4boxfile.initializeSegmentation();
    for (var i = 0; i < initSegs.length; i++) {
      var sb = initSegs[i].user;
      if (i === 0) {
        sb.ms.pendingInits = 0;
      }
      sb.addEventListener("updateend", this.onInitAppended.bind(this));
      mp4box.Log.info(`MSE - SourceBuffer #${sb.id}`, "Appending initialization data");
      sb.appendBuffer(initSegs[i].buffer);
      this.saveBuffer(initSegs[i].buffer, `track-${initSegs[i].id}-init.mp4`);
      sb.segmentIndex = 0;
      sb.ms.pendingInits++;
    }
    this.onStatusChangeCallback?.("initializeAllSourceBuffers", false);
    this.onStatusChangeCallback?.("initializeSourceBuffers", false);
  };
  /* Load END */

  /* SB Append START */
  onInitAppended(e) {
    this.SHOW_LOGS && console.log("onInitAppended");
    var sb = e.target;
    if (sb.ms.readyState === "open") {
      this.updateBufferedString(sb, "Init segment append ended");
      sb.sampleNum = 0;
      sb.removeEventListener("updateend", (e) => this.onInitAppended(e));
      sb.addEventListener(
        "updateend",
        this.onUpdateEnd.bind(this, sb, true, true)
      );
      /* In case there are already pending buffers we call onUpdateEnd to start appending them*/
      this.onUpdateEnd(sb, false, true);
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
    this.mp4boxfile.start();
    this.downloader.resume();
  };

  onUpdateEnd(sb, isNotInit, isEndOfAppend) {
    this.SHOW_LOGS &&
      console.log(
        "onUpdateEnd",
        sb.id,
        sb.ms.readyState,
        sb.updating,
        sb.pendingAppends.length,
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
          if (sb.ms.readyState === "open" && !sb.updating) sb.ms.endOfStream();
        } catch (e) {
          const errId = `MSE - SourceBuffer #${sb.id}`;
          mp4box.Log.error(errId, e);
          this.onErrorCallback?.(errId, e, sb);
        }
      }
    }
    if (
      sb.ms.readyState === "open" &&
      sb.updating === false &&
      sb.pendingAppends.length > 0
    ) {
      var obj = sb.pendingAppends.shift();
      mp4box.Log.info(
        `MSE - SourceBuffer #${sb.id}`,
        `Appending new buffer, pending: ${sb.pendingAppends.length}`
      );
      sb.sampleNum = obj.sampleNum;
      sb.is_last = obj.is_last;
      sb.appendBuffer(obj.buffer);
    }
  }

  updateBufferedString = (sb, string) => {
    this.SHOW_LOGS &&
      console.log("updateBufferedString", sb.id, sb.ms.readyState);
    var rangeString;
    if (sb.ms.readyState === "open") {
      rangeString = mp4box.Log.printRanges(sb.buffered);
      const currTime = mp4box.Log.getDurationString(this.video.currentTime, 1);
      mp4box.Log.info(
        `MSE - SourceBuffer #${sb.id}`,
        `${string}, updating: ${sb.updating}, currentTime: ${currTime}, buffered: ${rangeString}, pending: ${sb.pendingAppends.length}`
      );
      // if (sb.bufferTd === undefined) { // TODO: miss
      //   sb.bufferTd = document.getElementById("buffer" + sb.id);
      // }
      // sb.bufferTd.textContent = rangeString;
    }
  };
  /* SB Append END */

  /* Buffer Management START */
  setShouldSaveBuffers = (shouldSaveBuffers) => {
    this.shouldSaveBuffers = shouldSaveBuffers;
  };
  saveBuffer = (buffer, name) => {
    this.SHOW_LOGS && console.log("saveBuffer", name);
    if (this.shouldSaveBuffers) {
      var d = new mp4box.DataStream(buffer);
      d.save(name);
    }
  };

  addSourceBufferListener = (info) => {
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

  addBuffer = (video, mp4track) => {
    this.SHOW_LOGS && console.log("addBuffer", mp4track.id);
    var sb;
    var ms = video.ms;
    var track_id = mp4track.id;
    var codec = mp4track.codec;
    var mime = 'video/mp4; codecs="' + codec + '"';
    var kind = mp4track.kind;
    if (codec == "wvtt") {
      if (!kind.schemeURI.startsWith("urn:gpac:")) ;
    } else {
      if (kind && kind.schemeURI === "urn:w3c:html5:kind") {
        kind.value || "";
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
        mp4box.Log.info(
          `MSE - SourceBuffer #${track_id}`,
          `Creation with type "${mime}"`
        );
        sb = ms.addSourceBuffer(mime);
        // if (trackDefaultSupport) {
        //   // TODO:
        //   sb.trackDefaults = new TrackDefaultList([trackDefault]);
        // }
        sb.addEventListener("error", function (e) {
          const errId = `MSE - SourceBuffer #${track_id}`;
          mp4box.Log.error(errId, e);
          this.onErrorCallback?.(errId, e);
        });
        sb.ms = ms;
        sb.id = track_id;
        this.mp4boxfile.setSegmentOptions(track_id, sb, {
          nbSamples: this.config.segmentSize,
        }); // TODO:
        sb.pendingAppends = [];
      } catch (e) {
        const errId = `MSE SourceBuffer #${track_id}`;
        const message = `Cannot create buffer with type '${mime}'`;
        mp4box.Log.error(errId, message, e);
        this.onErrorCallback?.(errId, e, message);
      }
    } else {
      mp4box.Log.warn(
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

  removeBuffer = (video, track_id) => {
    this.SHOW_LOGS && console.log("removeBuffer", track_id);
    var i;
    var sb;
    var ms = video.ms;
    mp4box.Log.info(`MSE - SourceBuffer #${track_id}`, "Removing buffer");
    var foundSb = false;
    for (i = 0; i < ms.sourceBuffers.length; i++) {
      sb = ms.sourceBuffers[i];
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
        if (track.label === "track_" + track_id) {
          track.mode = "disabled";
          track.div.style.display = "none";
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
  initTrackViewer = (track) => {
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
  getControls() {
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
  generateMovieInfo = (info) => {
    const fileLength = this.downloader.getFileLength();
    const bitrate = Math.floor(
      (fileLength * 8 * info.timescale) / (info.duration * 1000)
    );

    const durationStr = (dur, timescale) =>
      timescale ? mp4box.Log.getDurationString(dur, timescale) : ``;
    const actualTime =
      `${info.duration}/${info.timescale} ` +
      durationStr(info.duration, info.timescale);
    const fragDurationStr = //
      durationStr(info.fragment_duration, info.timescale);

    const movieInfo = {
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
      const typeKey = `${type.toLowerCase()}Tracks`;
      if (info[typeKey]) {
        movieInfo.trackInfo.push({ type: type, tracks: info[typeKey] });
      }
    }

    this.onMovieInfoCallback?.(movieInfo);
  };

  /**
   * Retrieves information about video, audio, and text tracks in HTML5 media element.
   * @returns {Object} - Object containing information about video, audio, and text tracks.
   */
  generateTrackInfo(video) {
    const trackInfo = {
      videoTracks: [],
      audioTracks: [],
      textTracks: [],
    };

    for (let i = 0; i < video.videoTracks.length; i++) {
      trackInfo.videoTracks.push({
        id: video.videoTracks[i].id,
        type: "video",
        kind: video.videoTracks[i].kind,
        label: video.videoTracks[i].label,
        language: video.videoTracks[i].language,
        selected: video.videoTracks[i].selected,
      });
    }

    for (let i = 0; i < video.audioTracks.length; i++) {
      trackInfo.audioTracks.push({
        id: video.audioTracks[i].id,
        type: "audio",
        kind: video.audioTracks[i].kind,
        label: video.audioTracks[i].label,
        language: video.audioTracks[i].language,
        enabled: video.audioTracks[i].enabled,
      });
    }

    for (let i = 0; i < video.textTracks.length; i++) {
      trackInfo.textTracks.push({
        id: video.textTracks[i].id,
        type: "text",
        kind: video.textTracks[i].kind,
        label: video.textTracks[i].label,
        language: video.textTracks[i].language,
        mode: video.textTracks[i].mode,
      });
    }

    this.onTrackInfoCallback?.(trackInfo);
  }

  /**
   * Converts a date object to an object containing 'date' and 'time' properties.
   * @param {Date} date - a JS Date object instance
   * @returns {Object} - Object with 'date' and 'time' properties.
   */
  dateFmt(date) {
    if (!date) return { date: "", time: "" };

    const formattedDate = {
      date: date.toISOString().slice(0, 10), // YYYY-MM-DD
      time: date.toTimeString().slice(0, 5), // hh:mm
    };

    return formattedDate;
  }
  /** Info END */
}

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
const PlayerControls = {};

exports.Downloader = Downloader;
exports.Mp4boxPlayer = Mp4boxPlayer;
exports.PlayerControls = PlayerControls;
