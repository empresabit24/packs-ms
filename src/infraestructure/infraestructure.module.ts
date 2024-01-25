import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { productos } from './microservice/entities/productos.entity';
import { parametros } from './microservice/entities/parametros.entity';
import { productoslocal } from './microservice/entities/productoslocal.entity';
import { stockproductostienda } from './microservice/entities/stockproductostienda.entity';
import { preciostipocliente } from './microservice/entities/preciostipocliente.entity';
import { movimientos } from './microservice/entities/movimientos.entity';
import { marcas } from './microservice/entities/marcas.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      productos,
      parametros,
      productoslocal,
      stockproductostienda,
      preciostipocliente,
      movimientos,
      marcas,
    ]),
  ],

  exports: [TypeOrmModule],
})
export class InfraestructureModule {}
