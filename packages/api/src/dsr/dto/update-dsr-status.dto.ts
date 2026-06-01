import { IsEnum } from 'class-validator';

export class UpdateDsrStatusDto {
  @IsEnum(['pending', 'verifying', 'processing', 'completed', 'rejected'] as const)
  status!: 'pending' | 'verifying' | 'processing' | 'completed' | 'rejected';
}
