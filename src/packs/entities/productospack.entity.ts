import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { packs } from './pack.entity';
import { productos } from '../../infraestructure/microservice/entities';

@Entity({
  name: 'productospack',
})
export class productospack {
  @PrimaryGeneratedColumn()
  idproductopack: number;

  @Column('int')
  idpack: number;

  @Column('int')
  idproducto: number;

  @Column('numeric')
  productquantity: number;

  @ManyToOne(() => packs, (pack) => pack.productos)
  @JoinColumn({ name: 'idpack' })
  pack: packs;

  @OneToOne(() => productos, (producto) => producto.idproducto)
  @JoinColumn({ name: 'idproducto' })
  producto: productos;
}
