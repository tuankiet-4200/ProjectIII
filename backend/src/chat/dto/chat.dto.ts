import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { InteractionType } from '@prisma/client';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message_text: string;
}

export class LogInteractionDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsEnum(InteractionType)
  interaction_type: InteractionType;
}
