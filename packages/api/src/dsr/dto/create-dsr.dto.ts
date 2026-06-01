import { IsString, IsEnum, IsDateString } from 'class-validator';
import { Regulation } from '@privguard/engine';

export class CreateDsrDto {
  @IsEnum(['access', 'deletion', 'portability', 'correction'] as const)
  type!: 'access' | 'deletion' | 'portability' | 'correction';

  @IsString()
  dataSubjectId!: string;

  @IsEnum(Regulation)
  regulation!: Regulation;

  @IsDateString()
  deadlineAt!: string;
}
