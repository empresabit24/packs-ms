import { IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsString()
  @MinLength(1)
  unitAllData: string;

  @IsString()
  @MinLength(1)
  brand: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  cost: number;

  @IsNumber()
  @IsPositive()
  rate: number;

  @IsNumber()
  @IsPositive()
  initial_stock: number;
}
