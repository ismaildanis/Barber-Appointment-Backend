import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateBarberDto {
    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    firstName: string

    @IsNotEmpty()
    lastName: string

    @IsNotEmpty()
    phone: string

    @IsNotEmpty()
    @MinLength(6)
    password: string
}