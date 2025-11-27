import { BadRequestException, Injectable } from "@nestjs/common";
import dayjs = require("dayjs");

@Injectable()
export class TimeRangeValidator {

  validateDateFormat(dateStr: string) {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

    if (!regex.test(dateStr)) {
      throw new BadRequestException(
        "Tarih formatı geçersiz. Format şu olmalıdır: YYYY-MM-DDTHH:mm"
      );
    }

    const date = dayjs(dateStr);

    if (!date.isValid()) {
      throw new BadRequestException("Geçersiz bir tarih girdiniz.");
    }

    return date;
  }

  validateNotPast(date: any) {
    const now = dayjs();

    if (date.isBefore(now)) {
      throw new BadRequestException("Geçmiş tarihe randevu alınamaz.");
    }
  }

  validateSlotMinutes(date: any, slot: number) {
    const minutes = date.minute();

    if (minutes % slot !== 0) {
      throw new BadRequestException(
        `Bu saat geçersizdir. Randevu aralığı ${slot} dakikadır.`
      );
    }
  }
}
