import { IsString, IsEnum, IsOptional, IsIP } from 'class-validator';
import { ConsentPurpose } from '@privguard/engine';

export class CreateConsentDto {
  @IsString()
  dataSubjectId!: string;

  @IsEnum(ConsentPurpose)
  purpose!: ConsentPurpose;

  @IsEnum(['granted', 'denied', 'withdrawn'] as const)
  status!: 'granted' | 'denied' | 'withdrawn';

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
