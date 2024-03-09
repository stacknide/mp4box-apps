import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const defaultConfig = {
  url: "http://localhost:3000/media/range/airbnb.mp4",
  segmentSize: 1000,
  chunkSize: 1000000,
  chunkTimeout: 500,
  extractionSize: 1,
  dataShardCount: 4,
  numOfBlocks: 16,
};

export const configAtom = atomWithStorage("config", defaultConfig);
export const blockSizeAtom = atom((get) => 65536 * get(configAtom).dataShardCount);

export const NO_EXT = "no-file-extension-found";
export const getDefaultFormat = () =>
  defaultConfig.url.split(".").pop() || NO_EXT;
export const formatAtom = atomWithStorage("format", getDefaultFormat());

export const shouldUseCustomFetcherAtom = atomWithStorage(
  "shouldUseCustomFetcher",
  false
);
