import { Status } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class BarberCancelDto {
    @IsOptional()
    @IsString()
    cancelReason?: string;

    @IsNotEmpty()
    @IsEnum(Status)
    status: Status;
}
