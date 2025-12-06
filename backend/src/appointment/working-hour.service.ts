import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "src/prisma/prisma.service";
import { AppointmentHolidayService } from "./holiday.service";
import { Status } from "@prisma/client";

import dayjs = require("dayjs");
import customParseFormat = require("dayjs/plugin/customParseFormat");
import utc = require("dayjs/plugin/utc");
import timezone = require("dayjs/plugin/timezone");

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

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
        const d = dayjs.tz(date, "YYYY-MM-DD", "Europe/Istanbul");
        if (!d.isValid()) throw new BadRequestException("Geçersiz tarih");
        return d;
    }
    async getDailyHours(barberId: number, date: string) {
        const day = this.validateDate(date);
        
        const today = dayjs().tz('Europe/Istanbul');
        if (await this.holiday.isHoliday(date)) return [];

        const work = await this.prisma.workingHour.findFirst({
            where: { barberId, dayOfWeek: day.day() }
        });
        if (!work) throw new NotFoundException("Bu gün için çalışma saatleri tanımlı değil.");

        const slot = work.slotSize === "MIN30" ? 30 : 15;
        const start = day.startOf("day").add(work.startMin, "minute");
        const end   = day.startOf("day").add(work.endMin, "minute");
        
        const hours: string[] = [];
        let current = start;

        while (current.isBefore(end)) {

            if (current.isSame(today, "day") && current.isBefore(today)) {
                current = current.add(slot, "minute");
                continue;
            }
            hours.push(current.format("HH:mm"));
            current = current.add(slot, "minute");
        }

        return hours;
    }

    async getBusyHours(barberId: number, date: string) {
        const day = dayjs(date, "YYYY-MM-DD");
        const dow = day.day();                 
        const work = await this.prisma.workingHour.findFirst({ where: { barberId, dayOfWeek: dow } });
        if (!work) return [];

        const slotSize = work.slotSize === "MIN30" ? 30 : 15;
        const start = day.startOf("day").add(work.startMin, "minute");
        const end   = day.startOf("day").add(work.endMin, "minute");

        const allSlots: string[] = [];
        for (let c = start; c.isBefore(end); c = c.add(slotSize, "minute")) {
            allSlots.push(c.format("HH:mm"));
        }

        const appointments = await this.prisma.appointment.findMany({
            where: {
                barberId,
                status: Status.SCHEDULED,
                appointmentStartAt: { lt: end.toDate() }, 
                appointmentEndAt:   { gt: start.toDate() },
            },
            select: { appointmentStartAt: true, appointmentEndAt: true },
        });

        const breaks = await this.prisma.breakPeriod.findMany({
            where: { workingHourId: work.id },
            select: { startMin: true, endMin: true },
        });

        const busySlots: string[] = [];
        for (const slot of allSlots) {
            const slotStart = dayjs(`${date} ${slot}`, "YYYY-MM-DD HH:mm");
            const slotEnd   = slotStart.add(slotSize, "minute");

            const overlapsAppt = appointments.some(app => {
                const apptStart = dayjs(app.appointmentStartAt);
                const apptEnd   = dayjs(app.appointmentEndAt);
                return slotStart.isBefore(apptEnd) && slotEnd.isAfter(apptStart);
            });

            const overlapsBreak = breaks.some(br => {
                const brStart = day.startOf("day").add(br.startMin, "minute");
                const brEnd   = day.startOf("day").add(br.endMin, "minute");
                return slotStart.isBefore(brEnd) && slotEnd.isAfter(brStart);
            });

            if (overlapsAppt || overlapsBreak) busySlots.push(slot);
        }

        return busySlots;
    }
}
