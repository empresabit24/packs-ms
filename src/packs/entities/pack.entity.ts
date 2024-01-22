import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  schema: 'sch_main',
  name: 'packs',
})
export class packs {
  @PrimaryGeneratedColumn()
  idpack: number;

  @PrimaryColumn('int')
  idproductopadre: number;

  @PrimaryColumn('int')
  idproductobase: number;

  @Column('int')
  productbasequantity: number;
}
