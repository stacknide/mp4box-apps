export function Instructions() {
  return (
    <>
      <h1>Instructions</h1>
      <p>To run this demo (in Chrome or Firefox), you should:</p>
      <ol>
        <li>
          Select an existing file or enter a URL. <br />
          Be careful to select a video hosted on a server which allows this page
          to fetch those videos using XHR (i.e. using CORS) or run Chrome in
          command line with the --test-type and --disable-web-security switches.
        </li>
        <li>
          Optionally change some settings:
          <ul>
            <li>
              Download Settings:
              <ul>
                <li>
                  Select a chunk size for the download of the media file. 0
                  means fetching the whole file in one XHR.
                </li>
                <li>
                  Select the timeout between two chunk downloads (the associated
                  bitrate is computed and displayed)
                </li>
                <li>
                  You can alternatively select the real-time download: the
                  timeout for download is computed based on the buffer state and
                  playback rate
                </li>
              </ul>
            </li>
            <li>
              Segmentation Settings: change the number of frames used to created
              a media segment. A small number means a lot of processing for the
              browser via MSE. A large number means additional latency before
              the initial playback.
            </li>
            <li>
              Debug Settings:
              <ul>
                <li>
                  Save Results: will download a file on your computer for each
                  created segment !
                </li>
                <li>
                  Log level: error, warning, info or debug messages are output
                  in the debug console.
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          Then either hit the "Play" button and let the file download and play,
          or control individually each step:
          <ol>
            <li>
              Hit the "Load Media Info" button. Chunks will be downloaded until
              there is enough data to display the file information.
            </li>
            <li>
              Once the file information is displayed, select the tracks you want
              to play. For each track a SourceBuffer or a TextTrack is created.
            </li>
            <li>
              Once your tracks are selected, initialize the Source Buffers with
              the "Initialize Source Buffers" button. (You can also hit the "Add
              and Initialize All Source Buffers". This will select all tracks
              and try to create a SourceBuffer for it. Might not work for all
              files!)
            </li>
            <li>
              Then hit the "Load Media Data &amp; Play" button to resume the
              download and let the playback start.
            </li>
          </ol>
        </li>
        <li>
          At any time, you can:
          <ul>
            <li>
              hit the "Stop Media Download" button and then "Load Media Data
              &amp; Play" again when ready.
            </li>
            <li>hit the "Reset" button to select a different URL.</li>
            <li>seek into the video using the timeline.</li>
            <li>change the playback rate of the video.</li>
          </ul>
        </li>
      </ol>
      <h3>Notes</h3>
      <ul>
        <li>
          The Media Source API in Chrome has some limitations, which you might
          encounter when playing with this demo:
          <ul>
            <li>It does not support more than 1 video and 1 audio</li>
            <li>
              It does not support adding new SourceBuffers once the existing
              SourceBuffers are initialized. But you can remove some, even
              during playback.
            </li>
          </ul>
        </li>
      </ul>
      <h3>Thanks</h3>
      <a href="https://github.com/gpac/mp4box.js">mp4box.js</a> library.
    </>
  );
}
