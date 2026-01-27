import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
    @MinLength(6)
    @IsNotEmpty()
    @IsString()
    oldPassword: string;
    
    @MinLength(6)
    @IsNotEmpty()
    @IsString()
    newPassword: string;
}