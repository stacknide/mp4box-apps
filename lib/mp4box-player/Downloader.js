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
    if (this.totalLength && this.chunkStart >= this.totalLength) {
      this.eof = true;
    }
    if (this.eof === true) {
      Log.info("Downloader", "File download done.");
      this.callback(null, true);
    }

    let range = "";
    if (this.chunkStart + this.chunkSize < Infinity) {
      range = `bytes=${this.chunkStart}-${
        this.chunkStart + this.chunkSize - 1
      }`;
      // if the file length is known we limit the max range to that length
      // if (this.totalLength !== 0) {
      //   maxRange = Math.min(maxRange, this.totalLength);
      // }
    }
    if (!range) return;

    var self = this;

    fetch(this.url, { headers: { Range: range } })
      .then(function (response) {
        if (response.status == 404) {
          self.callback(null, false, true);
        }

        if ([200, 206, 304, 416].includes(response.status)) {
          response.arrayBuffer().then(function (data) {
            // const rangeReceived = response.headers.get("Content-Range");
            var start = self.chunkStart;
            var end = start + data.byteLength - 1;
            var totalLength = 28884979;
            var rangeReceived = `bytes ${start}-${end}/${totalLength}`;

            Log.info("Downloader", "Received data range: " + rangeReceived);

            if (!self.totalLength && rangeReceived) {
              var sizeIndex = rangeReceived.indexOf("/");
              if (sizeIndex > -1) {
                self.totalLength = +rangeReceived.slice(sizeIndex + 1);
              }
            }

            self.eof =
              data.byteLength !== self.chunkSize ||
              data.byteLength === self.totalLength;

            var buffer = data;
            buffer.fileStart = start;

            if (!buffer.fileStart) {
              buffer = buffer.slice(0);
              buffer.fileStart = start;
            }

            self.callback(buffer, self.eof);

            if (self.isActive === true && self.eof === false) {
              var timeoutDuration = 0;

              if (!self.realtime) {
                timeoutDuration = self.chunkTimeout;
              } else {
                // timeoutDuration = computeWaitingTimeFromBuffer(video); // TODO: miss
                timeoutDuration = self.chunkTimeout;
              }

              if (self.downloadTimeoutCallback)
                self.downloadTimeoutCallback(timeoutDuration);

              Log.info(
                "Downloader",
                "Next download scheduled in " +
                  Math.floor(timeoutDuration) +
                  " ms."
              );

              self.timeoutID = window.setTimeout(
                self.getFile.bind(self),
                timeoutDuration
              );
            } else {
              self.isActive = false;
            }
          });
        }
      })
      .catch(function (error) {
        Log.error("Downloader", error.message);
        self.callback(null, false, true);
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
