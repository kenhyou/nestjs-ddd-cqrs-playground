import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemRequest {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderRequest {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemRequest)
  items: CreateOrderItemRequest[];
}
