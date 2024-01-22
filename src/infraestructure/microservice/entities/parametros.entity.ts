import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'parametros', schema: 'sch_main' })
export class parametros {
  @PrimaryGeneratedColumn()
  idparametro: number;

  @Column('text')
  nombre: string;

  @Column('text')
  valor: string;

  @Column('numeric')
  idusuario: string;

  @Column()
  fecharegistro: string;

  @Column('text')
  tipo: string;

  @Column('text')
  descripcion: string;
}
