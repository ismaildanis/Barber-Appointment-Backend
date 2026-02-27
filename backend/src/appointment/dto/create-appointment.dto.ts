import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional, ArrayNotEmpty, IsArray } from "class-validator";

export class CreateAppointmentDto {
    @IsNotEmpty()
    @IsInt()
    barberId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    serviceIds: number[];

    @IsOptional()
    @IsInt()
    rewardId?: number;

    @IsNotEmpty()
    @IsDateString()
    appointmentStartAt: Date;

    @IsString()
    @IsOptional()
    notes?: string;
}