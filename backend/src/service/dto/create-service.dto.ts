import { IsDecimal, IsNotEmpty, IsOptional, IsString, IsInt } from "class-validator";

export class CreateServiceDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsDecimal()
    price: number

    @IsNotEmpty()
    @IsInt()
    duration: number
}
