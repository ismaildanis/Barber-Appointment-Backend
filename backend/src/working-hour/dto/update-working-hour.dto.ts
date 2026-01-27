import { IsNotEmpty, IsInt, IsOptional } from "class-validator";

export class UpdateWorkingHourDto {
    @IsOptional()
    @IsInt()
    dayOfWeek: number;

    @IsOptional()
    @IsInt()
    startMin: number;

    @IsOptional()
    @IsInt()
    endMin: number;
}