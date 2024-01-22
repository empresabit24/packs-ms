export interface ProductInterface {
  idproducto?: number;
  producto: string;
  descripcion?: string;
  idsubclase: number;
  idmarca: number;
  idestado: number;
  sku?: string;
  idproductopadre: number;
  cobertura_min?: number;
  cobertura_max?: number;
  nombrecomercial: string;
}
