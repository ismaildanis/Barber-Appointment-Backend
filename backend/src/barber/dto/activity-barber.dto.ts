import { IsBoolean, IsOptional } from "class-validator";

export class ActivityBarberDto {
   @IsOptional()
   @IsBoolean()
   active: boolean
}