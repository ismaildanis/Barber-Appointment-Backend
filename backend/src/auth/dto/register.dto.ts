import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
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
    @IsNotEmpty()
    phone: string;
    
    @MinLength(6)
    @IsNotEmpty()
    password: string;
}