import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useMemo } from "react";

export const defaultConfig = {
  url: "http://localhost:3000/media/range/airbnb.mp4",
  segmentSize: 1000,
  chunkSize: 1000000, // 1 MB
  chunkTimeout: 500,
  extractionSize: 1,
  dataShardCount: 4,
  numOfBlocks: 16,
};

export const configAtom = atomWithStorage("config", defaultConfig);
export const blockSizeAtom = atom(
  (get) => 65536 * get(configAtom).dataShardCount
);

export const shouldUseCustomFetcherAtom = atomWithStorage(
  "shouldUseCustomFetcher",
  false
);

export const defaultTranscoderConfig = {
  isEnabled: false,
  enableLogs: true,
  dist: "esm",
  enableMultiThreading: false,
  enableProgressIndicator: false,
  progress: 0,
};

export const transcoderConfigAtom = atomWithStorage(
  "transcoderConfig",
  defaultTranscoderConfig
);

export const playerResetKeyAtom = atom((get) => {
  const config = get(configAtom);
  const configStr = Object.values(config).join("-");

  const transcoderConfig = get(transcoderConfigAtom);
  const transcoderConfigStr = Object.values(transcoderConfig).join("-");

  return `${configStr}-${transcoderConfigStr}`;
});

export const videoListAtom = atomWithStorage("videoList", ["airbnb.mp4"]);

export const NO_EXT = "no-file-extension-found";
export const getDefaultFormat = () =>
  defaultConfig.url.split(".").pop() || NO_EXT;
export const formatAtom = atomWithStorage("format", getDefaultFormat());

export const useActiveFormat = () => {
  const [format] = useAtom(formatAtom);

  const getActiveFormat = () => {
    const defaultFormat = format === NO_EXT ? getDefaultFormat() : "";
    const isOnlineHosted = format === "hosted-online";
    const activeFormat = isOnlineHosted ? defaultFormat : format;
    return activeFormat;
  };

  return useMemo(getActiveFormat, [format]);
};
