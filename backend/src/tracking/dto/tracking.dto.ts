import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTrackingEventDto {
  @IsString()
  @IsNotEmpty()
  event_type: string; // order_packed, picked_up, arrived_at_hub, delivering, delivered

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  shipper_id?: string;
}
