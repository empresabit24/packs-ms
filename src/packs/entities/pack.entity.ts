import {
  CreateDateColumn,
  Entity, JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { productos } from '../../infraestructure/microservice/entities';

@Entity({
  schema: 'sch_main',
  name: 'packs',
})
export class packs {
  @PrimaryGeneratedColumn()
  idpack: number;

  @PrimaryColumn('int')
  idproducto: number;

  @CreateDateColumn()
  creationdate: Date;

  @OneToOne(() => productos, (producto) => producto.idproducto)
  @JoinColumn({ name: 'idproducto' })
  infoPack: productos;
}
