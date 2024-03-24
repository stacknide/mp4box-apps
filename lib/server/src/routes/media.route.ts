import { Router } from 'express';
import { MediaController } from '@controllers/media.controller';
import { Routes } from '@interfaces/routes.interface';
import { MediaBlocksDto } from '@/dtos/media.dto';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class MediaRoute implements Routes {
  public path = '/media';
  public router = Router();
  public media = new MediaController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/list`, this.media.getVideoList);
    this.router.get(`${this.path}/range/:fileName`, this.media.httpRangeRequest);
    this.router.post(`${this.path}/blocks`, ValidationMiddleware(MediaBlocksDto), this.media.blocksRangeRequest);
    this.router.get(`${this.path}/size/:fileName`, this.media.getFileDetails);
  }
}
