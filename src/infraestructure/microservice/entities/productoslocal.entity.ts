import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'productoslocal', schema: 'sch_main' })
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
}
