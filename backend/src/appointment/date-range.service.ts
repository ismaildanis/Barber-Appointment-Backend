import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import dayjs = require('dayjs');
import { AppointmentHolidayService } from "./holiday.service";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { PrismaService } from "src/prisma/prisma.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Istanbul');
@Injectable()
export class DateRangeService {
    constructor(
        private holidayService: AppointmentHolidayService,
        private prisma: PrismaService

    ) {}

    async getAvailableDates() {
        const result: string[] = [];
        let current = dayjs().tz('Europe/Istanbul').startOf('day');
        
        while (result.length < 5) {
            const dateStr = current.format('YYYY-MM-DD');

            const isHoliday = await this.holidayService.isHoliday(dateStr);

            if (!isHoliday) {
                result.push(dateStr);
            }

            current = current.add(1, 'day');
        }
        return result;
    }

    async getAvailableHours(barberId: number, date: string) {

        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(date)) {
            throw new BadRequestException("Tarih formatı 'YYYY-MM-DD' olmalıdır.");
        }

        const [year, month, day] = date.split('-').map(Number);

        const realDate = new Date(year, month - 1, day);

        if (
            realDate.getFullYear() !== year ||
            realDate.getMonth() !== month - 1 ||
            realDate.getDate() !== day
        ) {
            throw new BadRequestException("Geçersiz bir tarih girdiniz.");
        }

        const result: string[] = [];

        const target = dayjs.tz(date, 'Europe/Istanbul').startOf('day');
        const today = dayjs().tz('Europe/Istanbul');
        

        const isHoliday = await this.holidayService.isHoliday(date);
        if (isHoliday) return [];

        const dayOfWeek = target.day();
        const workingHour = await this.prisma.workingHour.findFirst({
            where: { barberId, dayOfWeek }
        });

        if (!workingHour) {
            throw new NotFoundException('Bu gün için çalışma saatleri tanımlı değil.');
        }

        const { startMin, endMin, slotSize } = workingHour;
        const interval = slotSize === 'MIN30' ? 30 : 15;

        let current = target.add(startMin, "minute");
        const end = target.add(endMin, "minute");

        while (current.isBefore(end)) {

            if (target.isBefore(today)) return [];

            if (target.isSame(today, "day") && current.isBefore(today)) {
                current = current.add(interval, "minute");
                continue;
            }


            result.push(current.format("HH:mm"));
            current = current.add(interval, "minute");
        }

        return result;
    }


}