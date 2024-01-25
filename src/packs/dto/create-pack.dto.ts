import {
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubclaseDTO {
  @IsNumber()
  idsubclase: number;
}

class MarcaDTO {
  @IsNumber()
  idmarca: number;
}

class ProductoDTO {
  @IsNumber()
  idproducto: number;

  @IsNumber()
  productquantity: number;
}

export class CreatePackDto {
  @IsNotEmpty()
  producto: string;

  @ValidateNested()
  @Type(() => SubclaseDTO)
  subclase: SubclaseDTO;

  @ValidateNested()
  @Type(() => MarcaDTO)
  marca: MarcaDTO;

  @IsNumber()
  cobertura_min: number;

  @IsNumber()
  cobertura_max: number;

  @IsNumber()
  costo: number;

  @IsNumber()
  precioestandar: number;

  @IsNumber()
  porcentajeganancia: number;

  @IsNumber()
  idlocal: number;

  @IsNumber()
  packquantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoDTO)
  @IsOptional()
  productos?: ProductoDTO[];
}
