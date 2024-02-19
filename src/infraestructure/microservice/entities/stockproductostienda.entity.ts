import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { productoslocal } from './productoslocal.entity';

@Entity({
  name: 'stockproductostienda',
})
export class stockproductostienda {
  @PrimaryGeneratedColumn()
  idstockproductotienda: number;

  @Column('int')
  idproductolocal: number;

  @Column('int')
  idtienda: number;

  @Column('int', { default: 3 })
  stock: number;

  @Column('int', { default: 0 })
  stock_unidades: number;

  @Column('int', { default: 0 })
  stock_presentacion: number;

  @ManyToOne(
    () => productoslocal,
    (productolocal) => productolocal.stockPacksLocal,
  )
  @JoinColumn({ name: 'idproductolocal' })
  stockpacks: productoslocal;
}
