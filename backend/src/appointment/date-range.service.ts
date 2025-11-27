import { Injectable, NotFoundException } from "@nestjs/common";
import dayjs = require('dayjs');
import { HolidayService } from "./holiday.service";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { PrismaService } from "src/prisma/prisma.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Istanbul');
@Injectable()
export class DateRangeService {
    constructor(
        private holidayService: HolidayService,
        private prisma: PrismaService

    ) {}

    async getAvailableDates() {
        const result: string[] = [];
        let current = dayjs().tz('Europe/Istanbul').startOf('day');
        
        while (result.length < 3) {
            const dateStr = current.format('YYYY-MM-DD');

            const isHoliday = await this.holidayService.isHoliday(dateStr);

            if (!isHoliday) {
                result.push(dateStr);
            }

            current = current.add(1, 'day');
        }
        return result;
    }

    async getAvailableHours(barberId: number) {
        const result: string[] = [];

        const now = dayjs().tz('Europe/Istanbul');
        const todayDateFormat = now.format('YYYY-MM-DD');

        const isHoliday = await this.holidayService.isHoliday(todayDateFormat);
        if (isHoliday) return []; 

        const dayOfWeek = dayjs().tz('Europe/Istanbul').day(); //bugün
        const workingHour = await this.prisma.workingHour.findFirst({
            where: {
                barberId,
                dayOfWeek,
            }
        })
        if (!workingHour) throw new NotFoundException('Bu güne ait uygun bir saat bulunamadı.');

        const { startMin, endMin, slotSize } = workingHour;
        const interval = slotSize === 'MIN30' ? 30 : 15;

        let current = now.startOf('day').add(startMin, 'minute'); 
        let end = now.startOf('day').add(endMin, 'minute'); 

        while (current.isBefore(end)) {

            if (current.isAfter(now)) {
                result.push(current.format('HH:mm'));
            }

            current = current.add(interval, 'minute');
        }

        return result;
    }

}