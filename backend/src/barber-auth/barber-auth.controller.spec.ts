import { Test, TestingModule } from '@nestjs/testing';
import { BarberAuthController } from './barber-auth.controller';

describe('BarberAuthController', () => {
  let controller: BarberAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarberAuthController],
    }).compile();

    controller = module.get<BarberAuthController>(BarberAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
