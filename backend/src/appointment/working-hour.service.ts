import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import dayjs = require("dayjs");
import { PrismaService } from "src/prisma/prisma.service";
import { AppointmentHolidayService } from "./holiday.service";

@Injectable()
export class WorkingHourService {

    constructor(
        private prisma: PrismaService,
        private holiday: AppointmentHolidayService,
    ) {}

    private validateDate(date: string) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new BadRequestException("Tarih formatı YYYY-MM-DD olmalıdır.");
        }

        const d = dayjs(date);
        if (!d.isValid()) {
            throw new BadRequestException("Geçersiz bir tarih girdiniz.");
        }

        return d;
    }

    async getDailyHours(barberId: number, date: string) {
        const day = this.validateDate(date);
        const today = dayjs().tz('Europe/Istanbul');

        if (await this.holiday.isHoliday(date)) return [];

        const work = await this.prisma.workingHour.findFirst({
            where: { barberId, dayOfWeek: day.day() }
        });

        if (!work) {
            throw new NotFoundException("Bu gün için çalışma saatleri tanımlı değil.");
        }

        const slot = work.slotSize === "MIN30" ? 30 : 15;
        const start = day.startOf("day").add(work.startMin, "minute");
        const end   = day.startOf("day").add(work.endMin, "minute");

        const hours: string[] = [];
        let current = start;

        while (current.isBefore(end)) {

            if (day.isSame(today, "day") && current.isBefore(today)) {
                current = current.add(slot, "minute");
                continue;
            }

            hours.push(current.format("HH:mm"));
            current = current.add(slot, "minute");
        }

        return hours;
    }
}
