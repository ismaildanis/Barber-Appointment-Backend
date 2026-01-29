import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateCustomerDto {

    @IsNotEmpty()
    firstName: string

    @IsNotEmpty()
    lastName: string

    @IsOptional()
    phone?: string

}