import { Log } from "@knide/mp4box";

export class Downloader {
  constructor() {
    this.isActive = false;
    this.realtime = false;
    this.chunkStart = 0;
    this.chunkSize = 0;
    this.totalLength = 0;
    this.chunkTimeout = 1000;
    this.url = null;
    this.callback = null;
    this.eof = false;
    this.downloadTimeoutCallback = null;
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

  getFile = () => {
    var dl = this;
    if (dl.totalLength && this.chunkStart >= dl.totalLength) {
      dl.eof = true;
    }
    if (dl.eof === true) {
      Log.info("Downloader", "File download done.");
      this.callback(null, true);
      return;
    }

    var range = null;
    var maxRange;

    if (this.chunkStart + this.chunkSize < Infinity) {
      range = "bytes=" + this.chunkStart + "-";
      maxRange = this.chunkStart + this.chunkSize - 1;

      range += maxRange;
    }

    var options = {
      method: "GET",
      headers: {
        Range: range,
      },
    };

    fetch(this.url, options)
      .then(function (response) {
        if (response.status == 404) {
          dl.callback(null, false, true);
        }

        if (
          response.status == 200 ||
          response.status == 206 ||
          response.status == 304 ||
          response.status == 416
        ) {
          return response.arrayBuffer();
        }
      })
      .then(function (buffer) {
        var start = dl.chunkStart;
        var end = dl.chunkStart + buffer.byteLength - 1;
        var totalLength = 28884979;
        var rangeReceived = `bytes ${start}-${end}/${totalLength}`;

        Log.info("Downloader", "Received data range: " + rangeReceived);

        if (!dl.totalLength && rangeReceived) {
          var sizeIndex;
          sizeIndex = rangeReceived.indexOf("/");
          if (sizeIndex > -1) {
            dl.totalLength = +rangeReceived.slice(sizeIndex + 1);
          }
        }

        dl.eof =
          buffer.byteLength !== dl.chunkSize ||
          buffer.byteLength === dl.totalLength;

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
            timeoutDuration = dl.chunkTimeout; // Temporary
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
        dl.callback(null, false, true);
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
    Log.info("Downloader", "Stopping file download");
    this.isActive = false;
    if (this.timeoutID) {
      window.clearTimeout(this.timeoutID);
      delete this.timeoutID;
    }
    return this;
  };
}
