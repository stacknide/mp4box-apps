import { Router } from 'express';
import { MediaController } from '@controllers/media.controller';
import { Routes } from '@interfaces/routes.interface';
// import { MediaBlocksDto } from '@/dtos/media.dto';
// import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class MediaRoute implements Routes {
  public path = '/media';
  public router = Router();
  public media = new MediaController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/range/:fileName`, this.media.httpRangeRequest);
    // this.router.post(`${this.path}/blocks/:fileName`, ValidationMiddleware(MediaBlocksDto), this.media.blocksRequest);
  }
}
