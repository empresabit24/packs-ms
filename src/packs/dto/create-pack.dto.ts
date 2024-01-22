import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class Subclase {
  @IsInt()
  idsubclase: number;
}

class Marca {
  @IsInt()
  idmarca: number;
}

class Unidad {
  @IsInt()
  idunidad: number;
}

class Presentacion {
  @IsInt()
  idpresentation: number;
}

class PresentacionList {
  @IsInt()
  idproducto: number;

  @ValidateNested()
  @Type(() => Presentacion)
  presentacion: Presentacion;

  @ValidateNested()
  @Type(() => Unidad)
  unidad: Unidad;

  @IsNumber()
  @IsOptional()
  cobertura_min: number;

  @IsNumber()
  @IsOptional()
  cobertura_max: number;

  @IsBoolean()
  aplica_icbper: boolean;

  @IsString()
  barcode: string;

  @IsString()
  estilo: string;

  @IsBoolean()
  presentacionprincipal: boolean;

  @IsNumber()
  @IsPositive()
  precioestandar: number;
}

export class CreatePackDto {
  @IsString()
  producto: string;

  @ValidateNested()
  @Type(() => Subclase)
  subclase: Subclase;

  @ValidateNested()
  @Type(() => Marca)
  marca: Marca;

  @ValidateNested()
  @Type(() => Unidad)
  unidad: Unidad;

  @IsNumber()
  cobertura_min: number;

  @IsNumber()
  cobertura_max: number;

  @IsInt()
  afectacion_igv: number;

  @IsBoolean()
  aplica_icbper: boolean;

  @ValidateNested({ each: true })
  @Type(() => PresentacionList)
  presentacion_list: PresentacionList[];
}
