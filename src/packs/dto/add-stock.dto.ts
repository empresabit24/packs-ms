import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class AddStockDto {
  @IsNumber()
  @IsPositive()
  @IsInt()
  idProducto: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  idLocal: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  stockToAdd: number;
}
