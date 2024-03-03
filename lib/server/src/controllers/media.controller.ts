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
          'Content-Type': 'video/mp4',
        });

        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });

        fs.createReadStream(videoFilePath).pipe(res);
      }
    } catch (error) {
      next(error);
    }
  };
}
