import { Status } from "@prisma/client";
import { IsEnum, IsNotEmpty } from "class-validator";

export class MarkAppointmentDto {
    @IsNotEmpty()
    @IsEnum(Status)
    status: Status
}