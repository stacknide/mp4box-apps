import {
  DataStream,
  Log,
  Textin4Parser,
  VTTin4Parser,
  XMLSubtitlein4Parser,
  createFile,
} from "@knide/mp4box";
import { Downloader } from "./Downloader";

const SHOW_LOGS = false;
export class Mp4boxPlayer {
  constructor(videoElement, initialDownloadConfig) {
    this.config = {
      url: "", // Video URL
      segmentSize: 1000, // The size of each segment.
      chunkSize: 1000000, // The size of each chunk.
      chunkTimeout: 500, // The timeout for chunk downloads.
      extractionSize: 1, // The size for extraction.
      ...initialDownloadConfig,
    };

    this.mp4boxfile;
    this.movieInfo;

    // Object responsible for file downloading
    this.downloader = new Downloader();
    this.downloader.setDownloadTimeoutCallback = this.setDownloadTimeout;
    this.autoplay = false;
    this.autoplay = true;

    // if !videoElement ...
    this.video = videoElement;

    // if (document.readyState !== 'complete')  ....
    this.overlayTracks = document.getElementById("overlayTracks");
    this.playButton = document.getElementById("playButton");
    this.startButton = document.getElementById("startButton");
    this.stopButton = document.getElementById("stopButton");
    this.loadButton = document.getElementById("loadButton");
    this.initButton = document.getElementById("initButton");
    this.initAllButton = document.getElementById("initAllButton");
    this.urlInput = document.getElementById("url");
    this.chunkTimeoutInput = document.getElementById("chunk_speed_range");
    this.chunkSizeInput = document.getElementById("chunk_size_range");
    this.infoDiv = document.getElementById("infoDiv");
    this.dlTimeoutDiv = document.getElementById("dlTimeout");
    this.chunkTimeoutLabel = document.querySelector("#chunk_speed_range_out");
    this.chunkSizeLabel = document.querySelector("#chunk_size_range_out");
    this.segmentSizeLabel = document.querySelector("#segment_size_range_out");
    this.extractionSizeLabel = //
      document.querySelector("#extraction_size_range_out");
    this.urlSelector = document.getElementById("urlSelector");
    this.urlSelector.selectedIndex = -1;
    this.saveChecked = document.getElementById("saveChecked");

    // ++
    this.html5MediaDiv = document.getElementById("html5MediaDiv");
    this.playbackRateLabel = document.querySelector("#playback_rate_range_out");
    this.chunkDownloadBitRate = document.querySelector("#chunk_dl_rate");

    // this.progress = 0;
    // this.progressbar;
    // this.progresslabel;

    this.onWindowLoad();
  }

  processInbandCue = () => {
    SHOW_LOGS && console.log("processInbandCue");
    var content = "";
    if (this.video.playing === false) {
      this.video.onPlayCue = this;
      return;
    }
    if (this.is_sync & this.track.config) {
      content = this.track.config;
    }
    content += this.text;
    SHOW_LOGS &&
      console.log(
        "Video Time:",
        this.video.currentTime,
        "Processing cue for track " + this.track.track_id + " with:",
        content
      );
    if (this.track.mime === "application/ecmascript") {
      var script = document.createElement("script");
      script.appendChild(document.createTextNode(content));
      this.track.div.appendChild(script);
      //this.track.div.innerHTML = "<script type='application/ecmascript'>"+content+"</script>";
    } else if (this.track.mime === "text/css") {
      this.track.div.innerHTML = "<style>" + content + "</style>";
    } else if (
      ["image/svg+xml", "text/html", "image/x3d+xml"].indexOf(this.track.mime) >
      -1
    ) {
      /* Presentable track */
      // this.track.div.innerHTML = content;
      // if (this.track.mime === "image/x3d+xml") {
      //   if (typeof x3dom !== "undefined") {
      //     x3dom.reload();
      //   }
      // }
    } else {
      /* Pure metadata track */
    }
  };

  /* Video Event Listeners START */
  addVideoEventListeners = () => {
    SHOW_LOGS && console.log("addVideoEventListeners");
    this.video.addEventListener("seeking", this.onSeeking.bind(this));
    this.video.addEventListener("playing", this.onPlaying.bind(this));
  };

  removeVideoEventListeners = () => {
    SHOW_LOGS && console.log("removeVideoEventListeners");
    this.video.removeEventListener("seeking", this.onSeeking);
    this.video.removeEventListener("playing", this.onPlaying);
  };

  onPlaying = (e) => {
    SHOW_LOGS && console.log("onPlaying");
    this.video.playing = true;
    if (this.video.onPlayCue) {
      this.processInbandCue.call(this.video.onPlayCue);
      this.video.onPlayCue = null;
    }
  };

  onSeeking(e) {
    SHOW_LOGS && console.log("onSeeking");

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

      seek_info = this.mp4boxfile.seek(this.video.currentTime, true);
      this.downloader.setChunkStart(seek_info.offset);
      this.downloader.resume();
      this.startButton.disabled = true;
      this.stopButton.disabled = false;
      this.video.lastSeekTime = this.video.currentTime;
    }
  }
  /* Video Event Listeners END */

  resetCues = () => {
    SHOW_LOGS && console.log("resetCues");
    for (var i = 0; i < this.video.textTracks.length; i++) {
      var texttrack = this.video.textTracks[i];
      while (texttrack.cues.length > 0) {
        texttrack.removeCue(texttrack.cues[0]);
      }
    }
  };

  onWindowLoad = () => {
    SHOW_LOGS && console.log("onWindowLoad");
    // TODO: If !video ...
    this.video.addEventListener("error", (e) => {
      Log.error("Video error", e);
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
      this.video.videoTracks.onchange = this.updateHtml5TrackInfo;
    if (this.video.audioTracks)
      this.video.audioTracks.onchange = this.updateHtml5TrackInfo;
    if (this.video.textTracks)
      this.video.textTracks.onchange = this.updateHtml5TrackInfo;
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
    SHOW_LOGS && console.log("reset");
    this.stop();
    this.downloader.reset();
    this.startButton.disabled = true;
    this.resetMediaSource();
    this.removeVideoEventListeners();
    this.resetDisplay();
  };

  /* Functions to generate the tables displaying file information */
  resetDisplay = () => {
    SHOW_LOGS && console.log("resetDisplay");
    this.infoDiv.innerHTML = "";
    this.html5MediaDiv.innerHTML = "";
    this.overlayTracks.innerHTML = "";
    //video.poster = '';
    //video.playing = false;
  };

  /* main functions, MSE-related */
  resetMediaSource = () => {
    SHOW_LOGS && console.log("resetMediaSource");
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
    SHOW_LOGS && console.log("onSourceClose");
    var ms = e.target;
    if (ms.video.error) {
      // TODO:
      Log.error("MSE", "Source closed, video error: " + ms.video.error.code);
    } else {
      Log.info("MSE", "Source closed, no error");
    }
  };

  onSourceOpen = (e) => {
    SHOW_LOGS && console.log("onSourceOpen");
    var ms = e.target;
    Log.info("MSE", "Source opened"); // TODO:
    Log.debug("MSE", ms);
    // this.urlSelector.disabled = false; // TODO
  };
  /* Reset END */

  stop = () => {
    SHOW_LOGS && console.log("stop");
    if (!this.downloader.isStopped()) {
      this.stopButton.disabled = true; // TODO:
      this.startButton.disabled = false; // TODO:
      this.downloader.stop();
    }
  };

  play = () => {
    SHOW_LOGS && console.log("play");
    // this.playButton.disabled = true;
    this.autoplay = true;
    this.video.play();
    this.load();
  };

  /* Load START */
  load = () => {
    SHOW_LOGS && console.log("load");
    var ms = this.video.ms;
    if (ms.readyState !== "open") {
      return;
    }

    this.mp4boxfile = createFile();
    this.addVideoEventListeners();
    this.mp4boxfile.onMoovStart = () => {
      Log.info("Application", "Starting to parse movie information");
    };
    this.mp4boxfile.onReady = (info) => {
      Log.info("Application", "Movie information received");
      this.movieInfo = info;
      if (info.isFragmented) {
        ms.duration = info.fragment_duration / info.timescale;
      } else {
        ms.duration = info.duration / info.timescale;
      }
      // displayMovieInfo(info, this.infoDiv); // TODO: miss
      this.addSourceBufferListener(info);
      this.stop();
      if (this.autoplay) {
        this.initializeAllSourceBuffers();
      } else {
        this.initAllButton.disabled = false; // TODO: removed
      }
    };
    this.mp4boxfile.onSidx = (sidx) => {
      SHOW_LOGS && console.log(sidx);
    };
    this.mp4boxfile.onItem = (item) => {
      var metaHandler = this.getMetaHandler();
      if (metaHandler.startsWith("mif1")) {
        var pitem = this.getPrimaryItem();
        SHOW_LOGS &&
          console.log("Found primary item in MP4 of type " + item.content_type);
        if (pitem.id === item.id) {
          this.video.poster = //
            window.URL.createObjectURL(new Blob([item.data.buffer]));
        }
      }
    };
    this.mp4boxfile.onSegment = (id, user, buffer, sampleNum, is_last) => {
      var sb = user;
      this.saveBuffer(
        buffer,
        "track-" + id + "-segment-" + sb.segmentIndex + ".m4s"
      );
      sb.segmentIndex++;
      sb.pendingAppends.push({ id, buffer, sampleNum, is_last });
      Log.info(
        "Application",
        "Received new segment for track " +
          id +
          " up to sample #" +
          sampleNum +
          ", segments pending append: " +
          sb.pendingAppends.length
      );
      this.onUpdateEnd(sb, true, false);
    };
    this.mp4boxfile.onSamples = (id, user, samples) => {
      var sampleParser;
      var cue;
      var texttrack = user;
      Log.info(
        "TextTrack #" + id,
        "Received " + samples.length + " new sample(s)"
      );
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
          SHOW_LOGS &&
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
            SHOW_LOGS &&
              console.log(
                "Parser Configuration: ",
                sample.description.txtC.config
              );
            texttrack.config = sample.description.txtC.config;
          }
          var textSample = sampleParser.parseSample(sample);
          SHOW_LOGS &&
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

    this.loadButton.disabled = true; // TODO:
    this.startButton.disabled = true;
    this.stopButton.disabled = false;

    this.downloader.setCallback((response, end, error) => {
      var nextStart = 0;
      if (response) {
        // TODO: remove / miss
        // this.progressbar.progressbar({
        //   value: Math.ceil(
        //     (100 * this.downloader.chunkStart) / this.downloader.totalLength
        //   ),
        // });
        var progressVal = Math.ceil(
          100 * (this.downloader.chunkStart / this.downloader.totalLength)
        );
        Log.info("Progress", `${progressVal}%`);
        nextStart = this.mp4boxfile.appendBuffer(response, end);
      }
      if (end) {
        // this.progressbar.progressbar({ value: 100 });
        Log.info("Progress", "100%");
        this.mp4boxfile.flush();
      } else {
        this.downloader.setChunkStart(nextStart);
      }
      if (error) {
        this.reset();
        // this.progresslabel.text("Download error!");
        Log.error("Progress", "Download error!");
      }
    });
    this.downloader.setInterval(this.config.chunkTimeout); // TODO:
    this.downloader.setChunkSize(this.config.chunkSize);
    // this.downloader.setUrl(urlInput.value); // TODO: miss
    if (!this.config.url) throw new Error("No URL specified!");
    this.downloader.setUrl(this.config.url);
    this.loadButton.disabled = true;
    this.downloader.start();
  };

  initializeAllSourceBuffers = () => {
    SHOW_LOGS && console.log("Initializing all source buffers");
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
    SHOW_LOGS && console.log("Initializing source buffers");
    var initSegs = this.mp4boxfile.initializeSegmentation();
    for (var i = 0; i < initSegs.length; i++) {
      var sb = initSegs[i].user;
      if (i === 0) {
        sb.ms.pendingInits = 0;
      }
      sb.addEventListener("updateend", this.onInitAppended.bind(this));
      Log.info("MSE - SourceBuffer #" + sb.id, "Appending initialization data");
      sb.appendBuffer(initSegs[i].buffer);
      this.saveBuffer(
        initSegs[i].buffer,
        "track-" + initSegs[i].id + "-init.mp4"
      );
      sb.segmentIndex = 0;
      sb.ms.pendingInits++;
    }
    this.initAllButton.disabled = true; // TODO
    this.initButton.disabled = true;
  };
  /* Load END */

  /* SB Append START */
  onInitAppended(e) {
    SHOW_LOGS && console.log("onInitAppended");
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
    SHOW_LOGS && console.log("Start");
    this.startButton.disabled = true;
    this.stopButton.disabled = false;
    this.downloader.setChunkStart(this.mp4boxfile.seek(0, true).offset);
    this.downloader.setChunkSize(this.config.chunkSize); // TODO
    this.downloader.setInterval(this.config.chunkTimeout);
    this.mp4boxfile.start();
    this.downloader.resume();
  };

  onUpdateEnd(sb, isNotInit, isEndOfAppend) {
    // SHOW_LOGS &&
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
        sb.ms.endOfStream();
      }
    }
    if (
      sb.ms.readyState === "open" &&
      sb.updating === false &&
      sb.pendingAppends.length > 0
    ) {
      var obj = sb.pendingAppends.shift();
      Log.info(
        "MSE - SourceBuffer #" + sb.id,
        "Appending new buffer, pending: " + sb.pendingAppends.length
      );
      sb.sampleNum = obj.sampleNum;
      sb.is_last = obj.is_last;
      sb.appendBuffer(obj.buffer);
    }
  }

  updateBufferedString = (sb, string) => {
    SHOW_LOGS && console.log("updateBufferedString", sb.id, sb.ms.readyState);
    var rangeString;
    if (sb.ms.readyState === "open") {
      rangeString = Log.printRanges(sb.buffered);
      Log.info(
        "MSE - SourceBuffer #" + sb.id,
        string +
          ", updating: " +
          sb.updating +
          ", currentTime: " +
          Log.getDurationString(this.video.currentTime, 1) +
          ", buffered: " +
          rangeString +
          ", pending: " +
          sb.pendingAppends.length
      );
      // if (sb.bufferTd === undefined) { // TODO: miss
      //   sb.bufferTd = document.getElementById("buffer" + sb.id);
      // }
      // sb.bufferTd.textContent = rangeString;
    }
  };
  /* SB Append END */

  /* Buffer Management START */
  saveBuffer = (buffer, name) => {
    SHOW_LOGS && console.log("saveBuffer", name);
    if (this.saveChecked.checked) {
      var d = new DataStream(buffer);
      d.save(name);
    }
  };

  addSourceBufferListener = (info) => {
    SHOW_LOGS && console.log("addSourceBufferListener");
    for (var i = 0; i < info.tracks.length; i++) {
      var track = info.tracks[i];
      var checkBox = document.getElementById("addTrack" + track.id);
      if (!checkBox) continue;
      checkBox.addEventListener(
        "change",
        ((t) => (e) => {
          var check = e.target;
          if (check.checked) {
            this.addBuffer(this.video, t);
            this.initButton.disabled = false;
            this.initAllButton.disabled = true;
          } else {
            this.initButton.disabled = this.removeBuffer(this.video, t.id);
            this.initAllButton.disabled = this.initButton.disabled;
          }
        })(track)
      );
    }
  };

  addBuffer = (video, mp4track) => {
    SHOW_LOGS && console.log("addBuffer", mp4track.id);
    var sb;
    var ms = video.ms;
    var track_id = mp4track.id;
    var codec = mp4track.codec;
    var mime = 'video/mp4; codecs="' + codec + '"';
    var kind = mp4track.kind;
    var trackDefault;
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
          "MSE - SourceBuffer #" + track_id,
          "Creation with type '" + mime + "'"
        );
        sb = ms.addSourceBuffer(mime);
        // if (trackDefaultSupport) {
        //   // TODO:
        //   sb.trackDefaults = new TrackDefaultList([trackDefault]);
        // }
        sb.addEventListener("error", function (e) {
          Log.error("MSE SourceBuffer #" + track_id, e);
        });
        sb.ms = ms;
        sb.id = track_id;
        this.mp4boxfile.setSegmentOptions(track_id, sb, {
          nbSamples: this.config.segmentSize,
        }); // TODO:
        sb.pendingAppends = [];
      } catch (e) {
        Log.error(
          "MSE - SourceBuffer #" + track_id,
          "Cannot create buffer with type '" + mime + "'" + e
        );
      }
    } else {
      Log.warn(
        "MSE",
        "MIME type '" +
          mime +
          "' not supported for creation of a SourceBuffer for track id " +
          track_id
      );
      var i;
      var foundTextTrack = false;
      for (i = 0; i < video.textTracks.length; i++) {
        var track = video.textTracks[i];
        if (track.label === "track_" + track_id) {
          track.mode = "showing";
          track.div.style.display = "inline";
          foundTextTrack = true;
          break;
        }
      }
      if (!foundTextTrack && html5TrackKind !== "") {
        var texttrack = video.addTextTrack(
          html5TrackKind,
          mp4track.name,
          mp4track.language
        );
        texttrack.id = track_id;
        texttrack.mode = "showing";
        this.mp4boxfile.setExtractionOptions(track_id, texttrack, {
          nbSamples: this.config.extractionSize,
        });
        texttrack.codec = codec;
        texttrack.mime = codec.substring(codec.indexOf(".") + 1);
        texttrack.mp4kind = mp4track.kind;
        texttrack.track_id = track_id;
        var div = document.createElement("div");
        div.id = "overlay_track_" + track_id;
        div.setAttribute("class", "overlay");
        this.overlayTracks.appendChild(div); // TODO
        texttrack.div = div;
        this.initTrackViewer(texttrack);
      }
    }
  };

  removeBuffer = (video, track_id) => {
    SHOW_LOGS && console.log("removeBuffer", track_id);
    var i;
    var sb;
    var ms = video.ms;
    Log.info("MSE - SourceBuffer #" + track_id, "Removing buffer");
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
    SHOW_LOGS && console.log("initTrackViewer", track.id);
    // TODO:
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

  getControls = () => {
    return {
      play: this.play,
      stop: this.stop,
      reset: this.reset,
      load: this.load,
      start: this.start,
      initializeAllSourceBuffers: this.initializeAllSourceBuffers,
      initializeSourceBuffers: this.initializeSourceBuffers,
    };
  };

  updateHtml5TrackInfo = () => {
    var content =
      "<table><thead><tr><th>Track ID</th><th>Type</th><th>Kind</th><th>Label</th><th>Language</th><th>Selected/enabled</th></tr></thead><tbody>";
    var i;
    for (i = 0; i < this.video.videoTracks.length; i++) {
      content +=
        "<tr>" +
        "<td>" +
        this.video.videoTracks[i].id +
        "</td>" +
        "<td>video</td>" +
        "<td>" +
        this.video.videoTracks[i].kind +
        "</td>" +
        "<td>" +
        this.video.videoTracks[i].label +
        "</td>" +
        "<td>" +
        this.video.videoTracks[i].language +
        "</td>" +
        "<td>" +
        this.video.videoTracks[i].selected +
        "</td>" +
        "</tr>";
    }
    for (i = 0; i < this.video.audioTracks.length; i++) {
      content +=
        "<tr>" +
        "<td>" +
        this.video.audioTracks[i].id +
        "</td>" +
        "<td>audio</td>" +
        "<td>" +
        this.video.audioTracks[i].kind +
        "</td>" +
        "<td>" +
        this.video.audioTracks[i].label +
        "</td>" +
        "<td>" +
        this.video.audioTracks[i].language +
        "</td>" +
        "<td>" +
        this.video.audioTracks[i].enabled +
        "</td>" +
        "</tr>";
    }
    for (i = 0; i < this.video.textTracks.length; i++) {
      content +=
        "<tr>" +
        "<td>" +
        this.video.textTracks[i].id +
        "</td>" +
        "<td>text</td>" +
        "<td>" +
        this.video.textTracks[i].kind +
        "</td>" +
        "<td>" +
        this.video.textTracks[i].label +
        "</td>" +
        "<td>" +
        this.video.textTracks[i].language +
        "</td>" +
        "<td>" +
        this.video.textTracks[i].mode +
        "</td>" +
        "</tr>";
    }
    content += "</tbody></table>";
    this.html5MediaDiv.innerHTML = content;
  };
}
