import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PacksService } from './packs.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { AuthGuard } from '../infraestructure/auth/auth.guard';
import { ApiHeader } from '@nestjs/swagger';

@ApiHeader({
  name: 'Authorization',
  description: 'JWT token, with prefix="Bearer"',
})
@Controller('packs')
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

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
    return this.packsService.unpack(id, idlocal);
  }
}
