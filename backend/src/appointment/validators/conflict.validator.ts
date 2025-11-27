import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import {  Status } from "@prisma/client";
import dayjs = require('dayjs');

@Injectable()
export class ConflictValidator {
  constructor(private prisma: PrismaService) {}

  async conflictValidate(dto: CreateAppointmentDto, startAt: any, endAt: any) {     
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        barberId: dto.barberId,
        status: Status.SCHEDULED,
        appointmentStartAt: { lt: endAt.toDate() },
        appointmentEndAt: { gt:  startAt.toDate() },
      },
    });

    return conflict ? false : true;
  }

}

