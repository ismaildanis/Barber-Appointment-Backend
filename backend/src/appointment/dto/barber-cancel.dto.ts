
import { IsOptional, IsString } from "class-validator";

export class BarberCancelDto {
    @IsOptional()
    @IsString()
    cancelReason?: string;
}
