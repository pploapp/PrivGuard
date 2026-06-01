import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ConsentService, Consent } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Controller('consents')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  create(@Body() dto: CreateConsentDto): Consent {
    return this.consentService.create(dto);
  }

  @Get('stats')
  getStats(): { byPurpose: Record<string, number>; byStatus: Record<string, number>; total: number } {
    return this.consentService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Consent | null {
    return this.consentService.findOne(id);
  }

  @Get()
  findAll(
    @Query('dataSubjectId') dataSubjectId?: string,
    @Query('purpose') purpose?: string,
  ): Consent[] {
    return this.consentService.findAll(dataSubjectId, purpose);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsentDto): Consent {
    return this.consentService.update(id, dto);
  }
}
