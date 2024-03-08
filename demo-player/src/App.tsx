import { useState } from "react";
import "./App.css";
import { Player } from "./Player";

const defaultConfig = {
  // url: "https://a0.muscache.com/airbnb/static/Paris-P1-1.mp4", // test AirBnB mp4 file
  url: "http://localhost:3000/media/range/airbnb.mp4",
  segmentSize: 1000,
  chunkSize: 1000000,
  chunkTimeout: 500,
  extractionSize: 1,
};

function App() {
  const [config, setConfig] = useState(defaultConfig);
  return (
    <>
      <Player config={config} key={Object.values(config).join("-")} />
      <ConfigModifier config={config} setConfig={setConfig} />
    </>
  );
}

export default App;

interface TConfigModifier {
  config: typeof defaultConfig;
  setConfig: React.Dispatch<React.SetStateAction<typeof defaultConfig>>;
}
function ConfigModifier({ config, setConfig }: TConfigModifier) {
  const videoNameList = [
    "3gp.3gp",
    "AVI_480_750kB.avi",
    "BigBuckBunny.mp4",
    "MOV_480_700kB.mov",
    "WMV_480_1_2MB.wmv",
    "Webm_ocean_with_audio.webm",
    "airbnb.mp4",
    "asf.asf",
    "frag-input-with_base_moof.mp4",
    "frag-input.mp4",
    "frag-recording-with_base_moof.mp4",
    "frag-recording.mp4",
    "frag_bunny.mp4",
    "input.mp4",
    "mkv.mkv",
    "mov-out.mp4",
    "oceans.mp4",
    "output.m4v",
    "recording.mp4",
  ];

  const sortByExtension = (a: string, b: string) => {
    const aExt = a.split(".").pop() || "";
    const bExt = b.split(".").pop() || "";
    if (aExt === bExt) return 0;
    return aExt < bExt ? -1 : 1;
  };

  videoNameList.sort(sortByExtension);

  const baseUrl = "http://localhost:3000/media/range";

  const selectedFileName = config.url.split("/").pop() || "";

  const chunkSizes = {
    "1MB": 1000000,
    "2MB": 2000000,
    "3MB": 3000000,
    "4MB": 4000000,
    "5MB": 5000000,
    "6MB": 6000000,
    "7MB": 7000000,
    "8MB": 8000000,
    "9MB": 9000000,
    "10MB": 10000000,
    "11MB": 11000000,
    "12MB": 12000000,
    "13MB": 13000000,
    "14MB": 14000000,
    "15MB": 15000000,
    "16MB": 16000000,
    "17MB": 17000000,
    "18MB": 18000000,
    "19MB": 19000000,
    "20MB": 20000000,
    "21MB": 21000000,
    "22MB": 22000000,
    "1000MB": 1000000000,
  };
  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
      <label>
        URL
        <select
          value={selectedFileName}
          onChange={(e) =>
            setConfig({ ...config, url: `${baseUrl}/${e.target.value}` })
          }
        >
          {videoNameList.map((name) => {
            const ext = name.split(".").pop() || "";
            const isSupported = ["mp4", "3gp", "mov"].includes(
              ext.toLowerCase()
            );
            return (
              <option key={"opt" + name} value={name}>
                {name} {isSupported ? "" : "(needs transcoding)"}
              </option>
            );
          })}
        </select>
      </label>
      <label>
        Segment Size
        <input
          type="number"
          value={config.segmentSize}
          onChange={(e) =>
            setConfig({ ...config, segmentSize: parseInt(e.target.value) })
          }
        />
      </label>
      <label>
        Chunk Size
        <select
          value={config.chunkSize}
          onChange={(e) =>
            setConfig({ ...config, chunkSize: parseInt(e.target.value) })
          }
        >
          {Object.entries(chunkSizes).map(([key, value]) => {
            return (
              <option key={"csz" + key} value={value}>
                {key}
              </option>
            );
          })}
        </select>
      </label>
      <label>
        Chunk Timeout
        <input
          type="number"
          value={config.chunkTimeout}
          onChange={(e) =>
            setConfig({ ...config, chunkTimeout: Number(e.target.value) })
          }
        />
      </label>
      <label>
        Extraction Size
        <input
          type="number"
          value={config.extractionSize}
          onChange={(e) =>
            setConfig({ ...config, extractionSize: Number(e.target.value) })
          }
        />
      </label>
    </div>
  );
}

// reset to default + jotai localstorage
