import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateAdminDto {

    @IsInt()
    @IsNotEmpty()
    shopId: number

    @IsNotEmpty()
    @IsString()
    firstName: string

    @IsNotEmpty()
    @IsString()
    lastName: string

    @IsOptional()
    @IsString()
    phone?: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @MinLength(6)
    @IsNotEmpty()
    password: string;
}