import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'sch_main',
})
export class preciostipocliente {
  @PrimaryGeneratedColumn()
  idpreciotipocliente: number;

  @Column('int')
  idproductolocal: number;

  @Column('int')
  idtipocliente: number;

  @Column('numeric', { default: 0.001 })
  desde: number;

  @Column('numeric', { default: 10000 })
  hasta: number;

  @Column('numeric')
  precio: number;

  @Column('int', { default: 3 })
  idestado: number;
}
