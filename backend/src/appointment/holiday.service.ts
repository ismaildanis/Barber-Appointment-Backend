import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import dayjs = require('dayjs');

@Injectable()
export class AppointmentHolidayService {
    constructor(private prisma: PrismaService) {}

    async isHoliday(dateStr: string): Promise<boolean> {
        
        const date = dayjs.tz(dateStr, 'Europe/Istanbul');
        //Pazar
        if (date.day() === 0) {
            return true;
        }

        const holiday = await this.prisma.holidayDate.findFirst({
            where: {
                date: new Date(date.format('YYYY-MM-DD'))
            }
        })
        
        return !!holiday;
    }
}