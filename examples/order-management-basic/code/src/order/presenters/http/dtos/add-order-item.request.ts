import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AddOrderItemRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}
