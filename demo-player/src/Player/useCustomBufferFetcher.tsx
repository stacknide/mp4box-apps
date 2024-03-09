import { useAtomValue } from "jotai";
import {
  getByteRangeToBlockNumberRange,
  getFileSize,
  sliceByteRangeFromBlockData,
} from "./utils";
import { blockSizeAtom, configAtom, formatAtom } from "../ConfigModifier/atoms";
import { useEffect, useRef } from "react";

export const useCustomBufferFetcher = (downloadUptoEnd = true) => {
  const config = useAtomValue(configAtom);
  const blockSize = useAtomValue(blockSizeAtom);

  const downloadBlocks = async (startBlockNum: number, endBlockNum: number) => {
    const fileName = config.url.split("/").pop();
    const dataShardCount = config.dataShardCount;
    const json = { fileName, startBlockNum, endBlockNum, dataShardCount };
    const res = await fetch("http://localhost:3000/media/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });

    const uint8Data = new Uint8Array(await res.arrayBuffer());
    return uint8Data;
  };

  const downloadByteRange = async (startByte: number, endByte: number) => {
    const [blockRange, sliceIndices] = //
      getByteRangeToBlockNumberRange(startByte, endByte, blockSize);
    const blockData = await downloadBlocks(...blockRange);

    return sliceByteRangeFromBlockData(
      blockData,
      sliceIndices,
      downloadUptoEnd
    );
  };

  const isOnlineHosted = useAtomValue(formatAtom) === "hosted-online";
  const fileSize = useRef(0);
  useEffect(() => void (fileSize.current = 0), [config.url]); // Reset fileSize on url change
  const abortableDownloadByteRange = async (
    startByte: number,
    endByte: number,
    signal: AbortSignal
  ) => {
    if (!fileSize.current) fileSize.current = await getFileSize(config.url);
    return new Promise((resolve, reject) => {
      let errMsg = "";
      if (isOnlineHosted)
        errMsg = "Cannot do custom fetching for online hosted videos";
      if (fileSize.current <= 0)
        errMsg = `Range request was aborted because fileSize is invalid. File Size: ${fileSize.current}.`;
      if (errMsg) {
        reject(new DOMException(errMsg, "AbortError"));
        return;
      }

      let isAborted = false;
      signal?.addEventListener("abort", () => {
        isAborted = true;
        reject(new DOMException("Range request was aborted", "AbortError"));
      });

      downloadByteRange(startByte, endByte).then((uint8Data) => {
        if (isAborted) return;

        resolve({ buffer: uint8Data.buffer, totalLength: fileSize.current });
      });
    });
  };

  return { downloadByteRange, abortableDownloadByteRange };
};
