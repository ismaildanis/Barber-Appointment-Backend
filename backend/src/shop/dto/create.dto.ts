import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateShopDto {

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    city: string

    @IsNotEmpty()
    @IsString()
    district: string

    @IsNotEmpty()
    @IsString()
    neighborhood: string

    @IsNotEmpty()
    @IsString()
    address: string
    
    @IsOptional()
    @IsString()
    phone?: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    @IsString()
    firstName: string

    @IsNotEmpty()
    @IsString()
    lastName: string

    @IsOptional()
    @IsString()
    adminPhone?: string

    @IsEmail()
    @IsNotEmpty()
    adminEmail: string

    @MinLength(6)
    @IsNotEmpty()
    adminPassword: string;

}