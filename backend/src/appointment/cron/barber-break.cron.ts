import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import dayjs = require("dayjs");
import customParseFormat = require("dayjs/plugin/customParseFormat");
import utc = require("dayjs/plugin/utc");
import timezone = require("dayjs/plugin/timezone");
import { Cron } from "@nestjs/schedule";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class BarberBreakCron {
    private readonly logger = new Logger(BarberBreakCron.name); 

    constructor(private prisma: PrismaService) {}

    @Cron('1 21 * * *')
    async deletePastBarberBreaks() {
        const now = dayjs().tz('Europe/Istanbul');
        const newDayStart = now.startOf('day').toDate();
        const outDated = await this.prisma.breakPeriod.deleteMany({
            where: {
                createdAt: { lt: newDayStart}
            }
        })
        this.logger.log(`${outDated.count} mola silindi`);
    }
}