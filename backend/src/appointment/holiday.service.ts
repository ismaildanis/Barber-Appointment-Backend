import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import dayjs = require('dayjs');
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Istanbul');

@Injectable()
export class HolidayService {
    constructor(private prisma: PrismaService) {}

    async isHoliday(dateStr: string): Promise<boolean> {
        
        const date = dayjs(dateStr).tz('Europe/Istanbul');

        //Pazar
        if (date.day() === 0) {
            return true;
        }

        const holiday = await this.prisma.holidayDate.findFirst({
            where: {
                date: date.toDate()
            }
        })
        
        return !!holiday;
    }
}