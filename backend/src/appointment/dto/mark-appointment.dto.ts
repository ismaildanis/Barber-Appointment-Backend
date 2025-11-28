import { IsOptional, IsString } from "class-validator";

export class MarkAppointmentDto {
    @IsOptional()
    @IsString()
    cancelReason?: string;
}