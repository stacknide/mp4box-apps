import { IsString, IsInt, Min } from 'class-validator';

// export class MediaRangeDto {
//   @IsString()
//   public fileName: string;
// }

export class MediaBlocksDto {
  @IsString()
  public fileName: string;

  @IsInt()
  @Min(0)
  public start: number;

  @IsInt()
  @Min(0)
  public end: number;
}
