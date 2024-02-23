import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { marcas } from './marcas.entity';
import { productoslocal } from './productoslocal.entity';
import { packs } from '../../../packs/entities/pack.entity';
@Entity({
  name: 'productos',
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

  @OneToOne(() => marcas)
  @JoinColumn({ name: 'idmarca' })
  marca: marcas;

  @OneToOne(() => productoslocal, (productolocal) => productolocal.producto)
  infoProductoLocal: productoslocal;

  @OneToOne(() => packs)
  @JoinColumn({ name: 'idproducto' })
  pack: packs;
}
