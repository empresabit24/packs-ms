import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { productospack } from './productospack.entity';
import { productos } from 'src/infraestructure/microservice/entities';

@Entity({
  schema: 'sch_main',
  name: 'packs',
})
export class packs {
  @PrimaryGeneratedColumn()
  idpack: number;

  @Column('int')
  idproducto: number;

  @CreateDateColumn()
  creationdate: Date;

  @OneToOne(() => productos)
  @JoinColumn({ name: 'idproducto' })
  infoPack: productos;

  @OneToMany(() => productospack, (productpack) => productpack.pack)
  @JoinColumn({ name: 'idpack' })
  productos: productospack[];
}
