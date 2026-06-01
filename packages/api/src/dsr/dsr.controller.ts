import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DsrService } from './dsr.service';
import { DsrRequest } from '@privguard/engine';
import { CreateDsrDto } from './dto/create-dsr.dto';
import { UpdateDsrStatusDto } from './dto/update-dsr-status.dto';

@Controller('dsr')
export class DsrController {
  constructor(private readonly dsrService: DsrService) {}

  @Post()
  create(@Body() dto: CreateDsrDto): DsrRequest {
    return this.dsrService.create(dto);
  }

  @Get('stats')
  getStats(): { byType: Record<string, number>; byStatus: Record<string, number>; total: number } {
    return this.dsrService.getStatistics();
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): DsrRequest[] {
    return this.dsrService.findAll(status, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string): DsrRequest | null {
    return this.dsrService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDsrStatusDto): DsrRequest {
    return this.dsrService.updateStatus(id, dto.status);
  }
}
