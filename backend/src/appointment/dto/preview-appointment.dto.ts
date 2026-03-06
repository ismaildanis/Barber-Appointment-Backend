import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional, ArrayNotEmpty, IsArray } from "class-validator";

export class PreviewAppointmentDto {
    @IsNotEmpty()
    @IsInt()
    barberId: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    serviceIds: number[];

    @IsNotEmpty()
    @IsDateString()
    appointmentStartAt: Date;

    @IsNotEmpty()
    @IsInt()
    rewardId: number

    @IsNotEmpty()
    @IsString()
    shopSlug: string
    
}