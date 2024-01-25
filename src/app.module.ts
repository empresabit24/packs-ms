import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PacksModule } from './packs/packs.module';

import * as entities from './infraestructure/microservice/entities';

import { packs } from './packs/entities/pack.entity';
import { productospack } from './packs/entities/productospack.entity';
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
        entities.parametros,
        entities.productos,
        entities.productoslocal,
        entities.stockproductostienda,
        entities.preciostipocliente,
        entities.movimientos,
        entities.marcas,
        productospack,
        packs,
      ],
      schema: 'sch_main',
    }),
    PacksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
