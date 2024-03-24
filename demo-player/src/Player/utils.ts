const byteToBlockNumber = (byteIdx: number, blockSize: number) => {
  const byteNumber = byteIdx + 1; // byteIdx start's from idx 0

  const blockNumber =
    byteNumber % blockSize === 0
      ? byteNumber / blockSize
      : Math.floor(byteNumber / blockSize) + 1;

  if (isNaN(blockNumber)) throw new Error("Invalid Block Number");
  if (blockNumber < 1) return 1;

  return blockNumber;
};

export const getByteRangeToBlockNumberRange = (
  startByte: number,
  endByte: number,
  blockSize: number
) => {
  const startBlockNumber = byteToBlockNumber(startByte, blockSize);
  const endBlockNumber = byteToBlockNumber(endByte, blockSize);

  const blockRange = [startBlockNumber, endBlockNumber] as const;

  const startBlockStartByte = (startBlockNumber - 1) * blockSize;
  const sliceStartIdx = startByte - startBlockStartByte;
  const sliceEndIdx = endByte - startBlockStartByte + 1; // +1 because that's how .slice() works
  const sliceIndices = [sliceStartIdx, sliceEndIdx] as const;

  return [blockRange, sliceIndices] as const;
};

/** Slices uint8 blockData into a our byte range (startByte to endByte)*/
export const sliceByteRangeFromBlockData = (
  blockData: Uint8Array,
  sliceIndices: readonly [number, number],
  uptoEnd = false
) => {
  const [sliceStartIdx, sliceEndIdx] = sliceIndices;

  if (sliceStartIdx < 0 || sliceEndIdx < 0)
    throw new Error(`Invalid slice indices: ${sliceIndices}`);

  const endIdx = Math.min(sliceEndIdx, blockData.length);

  if (uptoEnd) return blockData.slice(sliceStartIdx);
  else return blockData.slice(sliceStartIdx, endIdx);
};

type TFileDetails = { size: number; duration: number };
export const getFileDetails = async (url: string) => {
  if (url.startsWith("https://"))
    return { size: undefined, duration: undefined };

  const fileName = url.split("/").pop();

  const fileSizeUrl = `http://localhost:3000/media/size/${fileName}`;

  try {
    const response = await fetch(fileSizeUrl);
    if (response.ok) {
      const { size, duration } = await response.json();
      return { size, duration } as TFileDetails;
    } else throw new Error("Failed to fetch file size");
  } catch (error) {
    console.error(error);
    return { size: undefined, duration: undefined };
  }
};
