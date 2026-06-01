import { IsEnum } from 'class-validator';

export class UpdateConsentDto {
  @IsEnum(['granted', 'denied', 'withdrawn'] as const)
  status!: 'granted' | 'denied' | 'withdrawn';
}
