import {
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SubclaseDTO {
  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  idsubclase: number;
}

class MarcaDTO {
  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  idmarca: number;
}

class ProductoDTO {
  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  idproducto: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 0.001,
    description: 'Cantidad del producto en el pack p.e. 2 manzanas',
  })
  productquantity: number;
}

export class CreatePackDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'Nombre del pack',
  })
  producto: string;

  @ValidateNested()
  @Type(() => SubclaseDTO)
  @ApiProperty({
    type: SubclaseDTO,
  })
  subclase: SubclaseDTO;

  @ValidateNested()
  @Type(() => MarcaDTO)
  @ApiProperty({
    type: MarcaDTO,
  })
  marca: MarcaDTO;

  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
    default: 2,
  })
  cobertura_min: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
    default: 5,
  })
  cobertura_max: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  costo: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
  })
  precioestandar: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
  })
  porcentajeganancia: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
    default: 1,
  })
  idlocal: number;

  @IsNumber()
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'Cantidad de packs a crear',
  })
  packquantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoDTO)
  @IsOptional()
  @ApiProperty({
    type: [ProductoDTO],
  })
  productos?: ProductoDTO[];
}
