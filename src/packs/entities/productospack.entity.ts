import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column('int')
  productquantity: number;
}
