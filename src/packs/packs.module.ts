import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PacksService } from './usecases/packs.service';
import { PacksController } from './packs.controller';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';

import { packs } from './entities/pack.entity';
import { productospack } from './entities/productospack.entity';
import { AddStockService } from './usecases/add-stock.service';
import { UnpackService } from './usecases/unpack.service';

@Module({
  controllers: [PacksController],
  providers: [PacksService, AddStockService, UnpackService],
  imports: [
    TypeOrmModule.forFeature([packs, productospack]),
    InfraestructureModule,
  ],
})
export class PacksModule {}
