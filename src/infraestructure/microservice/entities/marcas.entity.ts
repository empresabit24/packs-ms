import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: 'marcas',
})
export class marcas {
  @PrimaryGeneratedColumn()
  idmarca: number;

  @Column('text')
  marca: string;
}
