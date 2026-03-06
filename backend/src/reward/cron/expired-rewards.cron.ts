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
export class ExpiredRewardsCron {
    private readonly logger = new Logger(ExpiredRewardsCron.name); 

    constructor(private prisma: PrismaService) {}

    @Cron('1 21 * * *')
    async expirePastAppointments() {
        const now = dayjs().tz('Europe/Istanbul').toDate();
        const outDated = await this.prisma.reward.updateMany({
            where: {
                status: "AVAILABLE",
                expiresAt: { lt: now }
            },
            data: {
                status: "EXPIRED"
            }
        })
        this.logger.log(`${outDated.count} ödülün tarihi geçti`);
    }
}