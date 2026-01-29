import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;
    
    @MinLength(8)
    @IsNotEmpty()
    password: string;

    @MinLength(8)
    @IsNotEmpty()
    passwordConfirm: string;
}