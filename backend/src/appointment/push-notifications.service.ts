import { BadRequestException, Injectable } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { PrismaService } from 'src/prisma/prisma.service';
const expo = new Expo();

@Injectable()
export class PushService {
  constructor(private prisma: PrismaService) {}

    async notify(userId: number, role: string, title: string, body: string, data?: any) {
        const tokens = (await this.prisma.pushToken.findMany({ where: { userId, role } })).map(t => t.token);
        if (!tokens.length) return;

        const messages = tokens.map(t => ({ to: t, sound: "default", title, body, data }));
        const chunks = expo.chunkPushNotifications(messages);

        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (err) {
                const invalid: string[] = chunk
                    .flatMap(m => Array.isArray(m.to) ? m.to : [m.to])
                    .filter(t => !Expo.isExpoPushToken(t));
                if (invalid.length) {
                    await this.prisma.pushToken.deleteMany({ where: { token: { in: invalid } } });
                }
            }
        }
    }

}
