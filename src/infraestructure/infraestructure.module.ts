import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './microservice/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      entities.productos,
      entities.parametros,
      entities.productoslocal,
      entities.stockproductostienda,
      entities.preciostipocliente,
      entities.movimientos,
      entities.marcas,
    ]),
  ],

  exports: [TypeOrmModule],
})
export class InfraestructureModule {}
