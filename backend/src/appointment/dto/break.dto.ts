import { IsNotEmpty } from "class-validator";

export class BreakDto {
    @IsNotEmpty()
    startMin: number;

    @IsNotEmpty()
    endMin: number;
}
