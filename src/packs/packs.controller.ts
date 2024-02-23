import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PacksService } from './usecases/packs.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { AuthGuard } from '../infraestructure/auth/auth.guard';
import { ApiHeader } from '@nestjs/swagger';
import { AddStockService } from './usecases/add-stock.service';
import { UnpackService } from './usecases/unpack.service';

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
  @Get('unpack/:id/:idlocal')
  unpack(@Param('id') id: number, @Param('idlocal') idlocal: number) {
    return this.unpackService.unpack(id, idlocal);
  }

  @UseGuards(AuthGuard)
  @Post('add-stock/:idproducto/:idlocal/:stockToAdd')
  addStock(
    @Param('idproducto') idproducto: number,
    @Param('idlocal') idlocal: number,
    @Param('stockToAdd') stockToAdd: number,
  ) {
    return this.addStockService.addStock(idproducto, idlocal, stockToAdd);
  }
}
