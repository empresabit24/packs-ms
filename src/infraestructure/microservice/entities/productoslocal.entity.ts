import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { productos } from './productos.entity';

@Entity({ name: 'productoslocal' })
export class productoslocal {
  @PrimaryGeneratedColumn()
  idproductolocal: number;

  @Column('numeric')
  idproducto: number;

  @Column('numeric')
  idlocal: number;

  @Column('numeric')
  idestado: number;

  @Column('numeric')
  precioestandar: number;

  @Column('numeric')
  costo: number;

  @Column('numeric')
  porcentajeganancia: number;

  @Column('numeric')
  preciobase: number;

  @OneToOne(() => productos, (producto) => producto.infoProductoLocal)
  @JoinColumn({ name: 'idproducto' })
  producto: productos;

  /*@OneToOne(() => packs, (pack) => pack.infoProductoLocal)
  @JoinColumn({ name: 'idproducto' })
  infoProducto: packs;*/
}
