import { IsNotEmpty } from "class-validator";

export class UpdateCustomerDto {

    @IsNotEmpty()
    firstName: string

    @IsNotEmpty()
    lastName: string

    @IsNotEmpty()
    phone: string

}