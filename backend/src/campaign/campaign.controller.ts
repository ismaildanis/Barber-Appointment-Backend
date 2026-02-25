import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put, Req, ParseIntPipe } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @UseGuards(JwtAdminGuard)
  async create(@Body() dto: CreateCampaignDto, @Req() req: any) {
    return this.campaignService.create(req.admin.shopId, dto);
  }

  @Get('shop/:slug')
  async findAll(@Param('slug') slug: string) {
    return this.campaignService.findAll(slug);
  }

  @Get('id/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.campaignService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampaignDto,
    @Req() req: any,
  ) {
    return this.campaignService.update(id, req.admin.shopId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.campaignService.remove(id, req.admin.shopId);
  }
}