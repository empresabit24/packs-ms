import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'movimientos' })
export class movimientos {
  @PrimaryGeneratedColumn()
  idmovimiento: number;

  @Column('numeric')
  idtipomovimiento: number;

  @Column('numeric')
  idstockproductotienda: number;

  @Column('numeric')
  entrada: number;

  @Column('numeric')
  salida: number;

  @Column('numeric')
  idusuario: number;

  @Column('numeric')
  stockfinal: number;

  @Column('text')
  detalle: string;
}
