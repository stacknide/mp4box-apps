import { useAtom } from "jotai";
import { FileSelector } from "./FileSelector";
import {
  configAtom,
  defaultConfig,
  formatAtom,
  getDefaultFormat,
  shouldUseCustomFetcherAtom,
} from "./atoms";

export function ConfigModifier() {
  const [config, setConfig] = useAtom(configAtom);
  const [, setFormat] = useAtom(formatAtom);
  const [shouldUseCustomFetcher] = useAtom(shouldUseCustomFetcherAtom);

  return (
    <div className="config-modifier-root">
      <FileSelector />

      {shouldUseCustomFetcher ? (
        <>
          <label>
            Data Shard count
            <select
              value={config.chunkSize}
              onChange={(e) =>
                setConfig({ ...config, chunkSize: Number(e.target.value) })
              }
            >
              {[
                [10, "main-net"],
                [4, "dev-net"],
              ].map(([shardCount, network]) => {
                return (
                  <option key={"shardCounr" + shardCount} value={shardCount}>
                    {shardCount} ({network} emulation)
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            number of blocks per segment
            <input
              type="number"
              value={config.numOfBlocks}
              min={1}
              max={32}
              onChange={(e) =>
                setConfig({ ...config, numOfBlocks: Number(e.target.value) })
              }
            />
          </label>
        </>
      ) : (
        <label>
          Chunk Size
          <select
            value={config.chunkSize}
            onChange={(e) =>
              setConfig({ ...config, chunkSize: Number(e.target.value) })
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
      )}

      <label>
        Segment Size
        <input
          type="number"
          value={config.segmentSize}
          onChange={(e) =>
            setConfig({ ...config, segmentSize: Number(e.target.value) })
          }
        />
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
      <button
        onClick={() => {
          setConfig(defaultConfig);
          setFormat(getDefaultFormat());
        }}
      >
        Reset defaults
      </button>
    </div>
  );
}

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
