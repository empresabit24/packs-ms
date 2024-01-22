import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity({
  schema: 'sch_main',
})
export class productos {
  @PrimaryGeneratedColumn()
  idproducto: number;

  @Column('text')
  producto: string;

  @Column('text')
  estilo: string;

  @Column('text')
  descripcion: string;

  @Column('numeric')
  idsubclase: number;

  @Column('numeric')
  idmarca: number;

  @Column('numeric')
  idestado: number;

  @Column('text')
  sku: string;

  @Column('numeric')
  idproductopadre: number;

  @Column('numeric')
  cobertura_min: number;

  @Column('numeric')
  cobertura_max: number;

  @Column('numeric')
  idunidadmedida: number;

  @Column('numeric')
  idpresentacion: number;

  @Column('text')
  nombrecomercial: string;

  @Column('boolean')
  presentacionprincipal: boolean;

  @Column('boolean')
  observacion: string;

  @Column('boolean')
  aplicaigv: boolean;

  @Column('numeric')
  peso: number;

  @Column('boolean')
  aplica_icbper: boolean;

  @Column('numeric')
  afectacion_igv: number;

  @Column('text')
  barcode: string;
}
