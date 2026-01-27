import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WorkingHourValidator {
    constructor (private prisma: PrismaService) {}

    async workingValidate(dto: any, apptStartAt: any, apptEndAt: any) {
        const work = await this.prisma.workingHour.findFirst({
        where: {
            barberId: dto.barberId,
            dayOfWeek: apptStartAt.day()
        }
        });

        if (!work) {
            throw new ConflictException("Bu gün berber çalışmıyor.");
        }

        const workStart = apptStartAt.startOf("day").add(work.startMin, "minute");
        const workEnd   = apptStartAt.startOf("day").add(work.endMin, "minute");

        if (apptStartAt.isBefore(workStart) || apptEndAt.isAfter(workEnd)) {
            throw new ConflictException("Randevu süresi çalışma saatleri dışında.");
        }

    }
}