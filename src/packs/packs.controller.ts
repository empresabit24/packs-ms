import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PacksService } from './usecases/packs.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { AuthGuard } from '../infraestructure/auth/auth.guard';
import { ApiHeader } from '@nestjs/swagger';
import { AddStockService } from './usecases/add-stock.service';
import { UnpackService } from './usecases/unpack.service';
import { AddStockDto } from './dto/add-stock.dto';
import { UnpackDto } from './dto/unpack.dto';

@ApiHeader({
  name: 'Authorization',
  description: 'JWT token, with prefix="Bearer"',
})
@Controller('packs')
export class PacksController {
  constructor(
    private readonly packsService: PacksService,
    private readonly unpackService: UnpackService,
    private readonly addStockService: AddStockService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createPackDto: CreatePackDto) {
    return this.packsService.create(createPackDto);
  }
  @UseGuards(AuthGuard)
  @Get(':idlocal')
  findAll(@Param('idlocal') idlocal: string) {
    return this.packsService.findAll(+idlocal);
  }
  @UseGuards(AuthGuard)
  @Get(':id/:idlocal')
  findOne(@Param('id') id: string, @Param('idlocal') idlocal: string) {
    return this.packsService.findOne(+id, +idlocal);
  }

  @UseGuards(AuthGuard)
  @Post('unpack')
  unpack(@Body() unpackDto: UnpackDto) {
    return this.unpackService.unpack(unpackDto);
  }

  @UseGuards(AuthGuard)
  @Post('add-stock')
  addStock(@Body() addStockDto: AddStockDto) {
    return this.addStockService.addStock(addStockDto);
  }
}
