import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PacksService } from './packs.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@Controller('packs')
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  create(@Body() createPackDto: any) {
    return this.packsService.create(createPackDto);
  }

  @Get()
  findAll() {
    return this.packsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePackDto: UpdatePackDto) {
    return this.packsService.update(+id, updatePackDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packsService.remove(+id);
  }
}
