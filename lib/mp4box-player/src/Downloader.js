import { Log } from "@knide/mp4box";
import { Transcoder } from "./Transcoder";

export class Downloader {
  /**
   * @constructor
   * @param {HTMLVideoElement} videoElement
   * @param {Transcoder} [transcoder]
   */
  constructor(videoElement, transcoder) {
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
      this.transcoder = transcoder;
      // transcoder.load();
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
      Log.info("Downloader", "File download done.");
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

          if (!dl.totalLength && !dl.customTotalLength) {
            throw new Error(
              "File byte length not available. Make sure your server exposes Content-Range header or set customTotalLength manually using setCustomTotalLength method in Downloader."
            );
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
        if (dl.transcoder) {
          const uInt8Arr = new Uint8Array(buf);
          const uInt8Output = //
            await dl.transcoder.transcode({ input: uInt8Arr, signal: signal });
          buffer = uInt8Output.buffer;
        } else buffer = buf;

        if (totalLength) dl.totalLength = totalLength;
        else throw new Error("file byte length not available");

        Log.info(
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
        } else Log.info(`EOF:${dl.eof}`, `Received Buffer Length: ${buffer.byteLength.toLocaleString()}, Expected Length: ${dl.chunkSize.toLocaleString()}, Total Length: ${dl.totalLength.toLocaleString()}`);

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

          Log.info(
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
    Log.info("Downloader", "Starting file download");
    this.chunkStart = 0;
    this.resume();
    return this;
  };

  resume = () => {
    Log.info("Downloader", "Resuming file download");
    this.isActive = true;
    if (this.chunkSize === 0) {
      this.chunkSize = Infinity;
    }
    this.getFile();
    return this;
  };

  stop = () => {
    this.abortController?.abort();

    Log.info("Downloader", "Stopping file download");
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
    Log.info(
      "Demo",
      "Playback position (" +
        Log.getDurationString(currentTime) +
        ") in current buffer [" +
        Log.getDurationString(maxStartRange) +
        "," +
        Log.getDurationString(minEndRange) +
        "]: " +
        Math.floor(ratio * 100) +
        "%"
    );
    if (ratio >= 3 / (playbackRate + 3)) {
      Log.info("Demo", "Downloading immediately new data!");
      // when the currentTime of the video is at more than 3/4 of the buffered range (for a playback rate of 1), immediately fetch a new buffer
      return 1; // return 1 ms (instead of 0) to be able to compute a non-infinite bitrate value
    } else {
      /* if not, wait for half (at playback rate of 1) of the remaining time in the buffer */
      wait = (1000 * (minEndRange - currentTime)) / (2 * playbackRate);
      Log.info(
        "Demo",
        "Waiting for " +
          Log.getDurationString(wait, 1000) +
          " s for the next download"
      );
      return wait;
    }
  }
}
