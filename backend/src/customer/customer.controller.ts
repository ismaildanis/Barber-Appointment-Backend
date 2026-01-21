import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(JwtAuthGuard)
  @Put('update')
  async update(@Body() updateCustomerDto: UpdateCustomerDto, @Req() req: any) {
    return await this.customerService.update(req.customer!.sub, updateCustomerDto);
  }

}
