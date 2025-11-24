import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateAppointmentDto {
    @IsInt()
    @IsOptional()
    barberId: number;

    @IsInt()
    @IsOptional()
    serviceId: number;

    @IsDateString()
    @IsOptional()
    appointmentAt: Date;

    @IsString()
    @IsOptional()
    notes?: string;
}