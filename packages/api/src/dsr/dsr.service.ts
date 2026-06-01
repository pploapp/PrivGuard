import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DsrWorkflowService, DsrRequest, DsrStatus } from '@privguard/engine';
import { CreateDsrDto } from './dto/create-dsr.dto';

@Injectable()
export class DsrService {
  private readonly workflowService: DsrWorkflowService;

  constructor() {
    this.workflowService = new DsrWorkflowService('./privguard-dsr.sqlite');
  }

  create(dto: CreateDsrDto): DsrRequest {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    return this.workflowService.createRequest(
      id,
      dto.type,
      dto.dataSubjectId,
      dto.regulation,
      dto.deadlineAt
    );
  }

  findOne(id: string): DsrRequest | null {
    return this.workflowService.getRequest(id);
  }

  findAll(status?: string, type?: string): DsrRequest[] {
    let requests = this.workflowService.getAllRequests();
    if (status) {
      requests = requests.filter((r) => r.status === status);
    }
    if (type) {
      requests = requests.filter((r) => r.type === type);
    }
    return requests;
  }

  updateStatus(id: string, status: DsrStatus): DsrRequest {
    const request = this.workflowService.getRequest(id);
    if (!request) {
      throw new NotFoundException(`DSR request with id ${id} not found`);
    }
    try {
      return this.workflowService.transitionStatus(id, status, 'API_STATUS_UPDATE');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid state transition';
      throw new BadRequestException(message);
    }
  }

  getStatistics(): { byType: Record<string, number>; byStatus: Record<string, number>; total: number } {
    return this.workflowService.getStatistics();
  }
}
