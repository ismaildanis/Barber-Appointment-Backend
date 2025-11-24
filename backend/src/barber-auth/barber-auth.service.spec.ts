import { Test, TestingModule } from '@nestjs/testing';
import { BarberAuthService } from './barber-auth.service';

describe('BarberAuthService', () => {
  let service: BarberAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarberAuthService],
    }).compile();

    service = module.get<BarberAuthService>(BarberAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
