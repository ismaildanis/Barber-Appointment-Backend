import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Throttle({ 'spinWheel': { ttl: 60, limit: 10 } })
  @Post(':slug/wheel')
  @UseGuards(JwtAuthGuard)
  async spinWheel(@Req() req: any, @Param('slug') slug: string) {
    return await this.gameService.spinWheel(req.customer.sub, slug);
  }
}
