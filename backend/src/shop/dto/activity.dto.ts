import { IsBoolean } from "class-validator";

export class ActivityDto {
    @IsBoolean()
    active: boolean;
}