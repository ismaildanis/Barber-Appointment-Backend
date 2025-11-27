import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional } from "class-validator";

export class CreateAppointmentDto {
    @IsNotEmpty()
    @IsInt()
    barberId: number;

    @IsNotEmpty()
    @IsInt()
    serviceId: number;

    @IsNotEmpty()
    @IsDateString()
    appointmentStartAt: Date;

    @IsString()
    @IsOptional()
    notes?: string;
}