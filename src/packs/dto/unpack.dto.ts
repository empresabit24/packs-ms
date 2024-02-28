import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UnpackDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsInt()
  idPack?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsInt()
  idProducto?: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  idLocal: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  stockToUnpack: number;
}
