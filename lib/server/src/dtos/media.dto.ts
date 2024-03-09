import { IsString, IsInt, Min } from 'class-validator';

// export class MediaRangeDto {
//   @IsString()
//   public fileName: string;
// }

export class MediaBlocksDto {
  @IsString()
  public fileName: string;

  @IsInt()
  @Min(1)
  public startBlockNum: number;

  @IsInt()
  @Min(1)
  public endBlockNum: number;

  @IsInt()
  @Min(4)
  public dataShardCount: number;
}
