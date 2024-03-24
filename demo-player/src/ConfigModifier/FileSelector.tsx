import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";
import {
  NO_EXT,
  configAtom,
  formatAtom,
  shouldUseCustomFetcherAtom,
  videoListAtom,
} from "./atoms";

const localBaseUrl = "http://localhost:3000/media/range";

export function FileSelector() {
  const [config, setConfig] = useAtom(configAtom);
  const [format, setFormat] = useAtom(formatAtom);
  const [videoNameList] = useAtom(videoListAtom);

  const [shouldUseCustomFetcher] = useAtom(shouldUseCustomFetcherAtom);

  const [groups, allFormats] = useMemo(() => {
    const groupByFormat = () => {
      const groups: { [key: string]: string[] } = {};
      videoNameList.forEach((name) => {
        const ext = name.split(".").pop() || NO_EXT;
        if (!groups[ext]) groups[ext] = [];
        groups[ext].push(name);
      });

      if (!shouldUseCustomFetcher)
        groups["hosted-online"] = [
          "https://a0.muscache.com/airbnb/static/Paris-P1-1.mp4",
        ];

      const groupKeys = Object.keys(groups);
      return [groups, groupKeys] as const;
    };
    return groupByFormat();
  }, [shouldUseCustomFetcher, videoNameList]);

  const fileList = groups[format] || [];
  useEffect(() => {
    const formatFileList = groups[format];
    if (formatFileList) {
      const isOnlineUrl = format === "hosted-online";
      const url = isOnlineUrl
        ? formatFileList[0]
        : `${localBaseUrl}/${formatFileList[0]}`;
      setConfig({ ...config, url });
    } else {
      // reset to default
      setFormat("mp4");
      setConfig({ ...config, url: `${localBaseUrl}/airbnb.mp4` });
    }
  }, [format, groups]);

  const selectedFileName = config.url.split("/").pop() || "";

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <label>
        Format
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          {allFormats.map((name) => (
            <option key={name} value={name.split(".").pop()}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        FileName
        <select
          value={selectedFileName}
          onChange={(e) => {
            let url = `${localBaseUrl}/${e.target.value}`;

            if (format === "hosted-online") url = e.target.value;

            setConfig({ ...config, url });
          }}
        >
          {fileList.map((name) => {
            const ext = (name.split(".").pop() || "").toLowerCase();
            const hasFrag = ext === "mp4" && name.startsWith("frag");
            const isSupported = ["mp4", "3gp", "mov"].includes(ext) && !hasFrag;
            return (
              <option key={"opt" + name} value={name}>
                {name} {isSupported ? "" : "(needs transcoding?)"}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
