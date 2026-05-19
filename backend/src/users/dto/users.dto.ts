import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEmail, MinLength, IsIn } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  address_line: string;

  @IsString()
  @IsNotEmpty()
  ward: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  address_line?: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsIn(['ADMIN', 'CUSTOMER', 'SHIPPER', 'MERCHANT'])
  role: any;
}
