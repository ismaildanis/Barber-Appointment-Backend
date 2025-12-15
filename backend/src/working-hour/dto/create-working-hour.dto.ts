import { IsNotEmpty, IsInt } from "class-validator";

export class CreateWorkingHourDto {
    @IsNotEmpty()
    @IsInt()
    dayOfWeek: number;

    @IsNotEmpty()
    @IsInt()
    startMin: number;

    @IsNotEmpty()
    @IsInt()
    endMin: number;
}