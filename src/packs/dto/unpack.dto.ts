import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnpackDto {
  // O bien usar idPack o bien usar idProducto, no usar ambos.
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsInt()
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'idPack, según tabla sch_main.packs',
  })
  idPack?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsInt()
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'idProducto del pack, según tabla sch_main.productos',
  })
  idProducto?: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'Local en el que se quiere disminuir el stock.',
  })
  idLocal: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'Cantidad de unidades a desarmar en el pack.',
  })
  stockToUnpack: number;
}
