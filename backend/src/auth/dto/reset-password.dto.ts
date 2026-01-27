import { IsNotEmpty, IsString, MinLength } from 'class-validator';
export class ResetPasswordDto {
  @IsString() @IsNotEmpty()
  resetSessionId: string;

  @IsString() @MinLength(8)
  newPassword: string;
}
