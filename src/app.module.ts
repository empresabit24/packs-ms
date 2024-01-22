import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import * as process from 'process';

import { PacksModule } from './packs/packs.module';
import { parametros } from './infraestructure/microservice/entities/parametros.entity';
import { productos } from './infraestructure/microservice/entities/productos.entity';
import { productoslocal } from './infraestructure/microservice/entities/productoslocal.entity';
import { packs } from './packs/entities/pack.entity';
import { stockproductostienda } from './infraestructure/microservice/entities/stockproductostienda.entity';
import { preciostipocliente } from './infraestructure/microservice/entities/preciostipocliente.entity';
import { movimientos } from './infraestructure/microservice/entities/movimientos.entity';
@Module({
  imports: [
    ConfigModule.forRoot(), // Carga y accede a la configuración de la aplicación desde variables de entorno.
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      //autoLoadEntities: true,
      //synchronize: true,
      entities: [
        parametros,
        productos,
        productoslocal,
        packs,
        stockproductostienda,
        preciostipocliente,
        movimientos,
      ],
      schema: 'sch_main',
    }),
    PacksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
