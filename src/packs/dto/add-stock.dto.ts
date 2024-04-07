import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddStockDto {
  @IsNumber()
  @IsPositive()
  @IsInt()
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'idProducto del pack, según tabla sch_main.productos',
  })
  idProducto: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: Number,
    default: 1,
    description: 'Local en el que se quiere aumentar el stock.',
  })
  idLocal: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'Stock por añadir en el pack.',
  })
  stockToAdd: number;
}
