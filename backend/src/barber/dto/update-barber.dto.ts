import { IsNotEmpty } from "class-validator";

export class UpdateBarberDto {

    @IsNotEmpty()
    firstName: string

    @IsNotEmpty()
    lastName: string

    @IsNotEmpty()
    phone: string

}