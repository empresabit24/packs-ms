import { Test, TestingModule } from '@nestjs/testing';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';

describe('PacksController', () => {
  let controller: PacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PacksController],
      providers: [PacksService],
    }).compile();

    controller = module.get<PacksController>(PacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
