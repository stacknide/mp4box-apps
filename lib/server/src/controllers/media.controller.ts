import { execSync } from 'child_process';
import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export class MediaController {
  public httpRangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const fileName = req.params.fileName;

    try {
      const videoFilePath = path.join(__dirname, '../static', fileName);
      const stat = fs.statSync(videoFilePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      const mimeType = getMimeType(videoFilePath) || 'video/mp4';

      if (range) {
        const [start, end] = range.replace(/bytes=/, '').split('-');
        const startByte = parseInt(start, 10);
        const endByte = end ? Math.min(parseInt(end, 10), fileSize - 1) : fileSize - 1;
        const chunkSize = endByte - startByte + 1;

        const fileStream = fs.createReadStream(videoFilePath, { start: startByte, end: endByte });

        res.writeHead(206, {
          'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
          'Access-Control-Expose-Headers': 'Content-Range',
        });

        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
        });

        fs.createReadStream(videoFilePath).pipe(res);
      }
    } catch (error) {
      next(error);
    }
  };
}

const getMimeType = (filePath: string) => {
  const platform = process.platform;

  if (['aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos'].includes(platform)) {
    // console.log(`${platform} Platform`);

    // Determine MIME type for Unix-like platforms
    try {
      const commandOutput = execSync(`file --mime-type -b "${filePath}"`, { encoding: 'utf8' });
      const mimeType = commandOutput.trim();
      return mimeType;
    } catch (error) {
      console.error('Error:', error);
      return '';
    }
  } else if (platform === 'win32') {
    // console.log('Windows Platform');

    // Determine MIME type for Windows
    try {
      const commandOutput = execSync(`certutil -hashfile "${filePath}" | findstr /i "hash"`, { encoding: 'utf8' });
      const hashInfo = commandOutput.trim();
      console.log('Hash Info:', hashInfo);
      return hashInfo;
    } catch (error) {
      console.error('Error:', error);
      return '';
    }
  } else {
    console.log('Unknown Platform - cannot determine MIME type');
    return '';
  }
};
