import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateBarberDto {

    @IsNotEmpty()
    firstName: string

    @IsNotEmpty()
    lastName: string

    @IsOptional()
    phone?: string

}