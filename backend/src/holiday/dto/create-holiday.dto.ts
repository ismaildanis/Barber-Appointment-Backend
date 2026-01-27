import { IsNotEmpty,IsString } from "class-validator";

export class CreateHolidayDto {
  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
