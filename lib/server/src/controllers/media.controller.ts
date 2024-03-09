import { execSync } from 'child_process';
import { NextFunction, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export class MediaController {
  public httpRangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const fileName = req.params.fileName;

    try {
      const { stat, path } = this.getVideoDetails(fileName);
      const fileSize = stat.size;

      const mimeType = this.getMimeType(path) || 'video/mp4';

      const range = req.headers.range;
      if (range) {
        const [start, end] = range.replace(/bytes=/, '').split('-');
        const startByte = parseInt(start, 10);
        const endByte = end ? Math.min(parseInt(end, 10), fileSize - 1) : fileSize - 1;
        const contentLength = endByte - startByte + 1;

        const fileStream = fs.createReadStream(path, { start: startByte, end: endByte });

        fileStream.on('open', () => {
          res.writeHead(206, {
            'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
            'Content-Length': contentLength,
            'Content-Type': mimeType,
            'Access-Control-Expose-Headers': 'Content-Range',
            'Accept-Ranges': 'bytes',
          });

          fileStream.pipe(res);
        });

        fileStream.on('error', error => {
          console.error('Error reading file stream:', error);
          res.status(500).send('Internal Server Error');
        });
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
        });

        fs.createReadStream(path).pipe(res);
      }
    } catch (error) {
      next(error);
    }
  };

  public blocksRangeRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { fileName, startBlockNum, endBlockNum, dataShardCount } = req.body;
    const blockSize = dataShardCount * 65536;

    try {
      const { stat, path } = this.getVideoDetails(fileName);
      const fileSize = stat.size;
      const mimeType = this.getMimeType(path) || 'video/mp4';

      const draftStartByte = (startBlockNum - 1) * blockSize;
      const draftEndByte = endBlockNum * blockSize - 1;
      const startByte = Math.max(0, draftStartByte);
      const endByte = Math.min(draftEndByte, fileSize - 1);

      const fileStream = fs.createReadStream(path, { start: startByte, end: endByte });
      fileStream.on('open', () => {
        console.log({ startByte, endByte });

        res.writeHead(206, {
          'Access-Control-Expose-Headers': 'Content-Range',
          'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`,
          'Content-Type': mimeType,
          'Content-Length': endByte - startByte + 1,
        });
        fileStream.pipe(res);
      });
      fileStream.on('error', error => {
        console.error('Error reading file stream:', error);
        res.status(500).send('Internal Server Error');
      });
    } catch (error) {
      next(error);
    }
  };

  public fileSize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const fileName = req.params.fileName;

    try {
      const { stat } = this.getVideoDetails(fileName);
      const fileSize = stat.size;
      res.status(200).json({ data: fileSize, message: 'fileSize' });
    } catch (error) {
      next(error);
    }
  };

  private getVideoDetails = (fileName: string) => {
    const videoFilePath = path.join(__dirname, '../static', fileName);
    const stat = fs.statSync(videoFilePath);
    return { stat, path: videoFilePath };
  };

  private getMimeType = (filePath: string) => {
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
}
