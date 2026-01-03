import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface CompanyDto {
  id: string;
  companyName: string;
  companyDescription: string;
  notes: string;
  contactPerson: string;
  contactNumber: string;
}

export interface OrderDto {
  id: string;
  companyId: string;
  companyName: string;
  orderDate: string;
  completionDate: string;
  deliveryDate: string;
  status: string;
  
  // NEW: Phase-centric data model
  phaseStates?: PhaseState[];
  totalMeasurements?: number;
  
  // OLD: Kept for backward compatibility
  phaseConfigIds?: string[]; // IDs of PhaseConfig entities
  completedPhaseIds?: string[]; // IDs of completed phases
  currentPhaseId?: string; // Current active phase ID
  skippedPhases?: SkippedPhase[]; // Phases that were skipped
  
  // Deprecated fields (kept for backward compatibility)
  phases?: string[];
  currentPhase?: string;
}

export interface PhaseState {
  phaseConfigId: string;
  phaseName: string;
  phaseKey: string;
  status: string; // "pending", "in-progress", "completed", "skipped"
  measurementIds: string[];
  count: number;
  userActivities?: { [userId: string]: UserActivity };
  startedAt?: string;
  completedAt?: string;
  skipReason?: string;
  skippedAt?: string;
  skippedBy?: string;
}

export interface UserActivity {
  userId: string;
  userName: string;
  completedCount: number;
  rejectedCount: number;
  firstActivityAt?: string;
  lastActivityAt?: string;
  completedMeasurementIds: string[];
}

export interface SkippedPhase {
  phaseId: string;
  phaseName: string;
  reason: string;
  skippedAt: Date;
  skippedBy?: string;
}

export interface MeasurementDto {
  id: string;
  orderId: string;
  companyId: string;
  empId: string;
  employeeName: string;
  department: string;
  state?: string; // Deprecated
  currentPhaseId?: string; // New: Current phase
  completedPhaseIds?: string[]; // New: Completed phases
  skippedPhases?: SkippedPhase[]; // New: Skipped phases
  // Add more fields as needed for measurements
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private baseUrl = `${environment.apiBaseUrl}/companies`;

  constructor(private http: HttpClient) {}

  getAllCompanies(): Observable<CompanyDto[]> {
    return this.http.get<CompanyDto[]>(this.baseUrl);
  }

  getCompanyById(id: string): Observable<CompanyDto> {
    return this.http.get<CompanyDto>(`${this.baseUrl}/${id}`);
  }

  createCompany(company: CompanyDto): Observable<CompanyDto> {
    return this.http.post<CompanyDto>(this.baseUrl, company);
  }

  updateCompany(id: string, company: CompanyDto): Observable<CompanyDto> {
    return this.http.put<CompanyDto>(`${this.baseUrl}/${id}`, company);
  }

  deleteCompany(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  getOrdersByCompanyId(companyId: string): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${environment.apiBaseUrl}/orders/company/${companyId}`);
  }

  createOrder(order: Partial<OrderDto>): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${environment.apiBaseUrl}/orders`, order);
  }

  uploadMeasurements(orderId: string, companyId: string, file: File, mode: 'add' | 'replace' = 'add') {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('companyId', companyId);
    formData.append('file', file);
    formData.append('mode', mode);
    return this.http.post(`${environment.apiBaseUrl}/measurements/upload`, formData);
  }

  getAllOrders(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${environment.apiBaseUrl}/orders`);
  }

  getOrderById(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${environment.apiBaseUrl}/orders/${id}`);
  }

  updateOrderPhase(orderId: string, newPhase: string) {
    return this.http.put(`${environment.apiBaseUrl}/orders/${orderId}/phase`, { phase: newPhase });
  }
  
  moveOrderToNextPhase(orderId: string, skipReason?: string): Observable<OrderDto> {
    const body = skipReason ? { skipReason } : {};
    return this.http.post<OrderDto>(`${environment.apiBaseUrl}/orders/${orderId}/move-to-next-phase`, body);
  }
  
  moveMeasurementToNextPhase(measurementId: string, skipReason?: string): Observable<MeasurementDto> {
    const body = skipReason ? { skipReason } : {};
    return this.http.post<MeasurementDto>(`${environment.apiBaseUrl}/measurements/${measurementId}/move-to-next-phase`, body);
  }
  
  /**
   * NEW: Bulk move measurements to next phase (avoids race conditions)
   */
  bulkMoveMeasurementsToNextPhase(measurementIds: string[], userId?: string, userName?: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/measurements/bulk/move-to-next-phase`, {
      measurementIds,
      userId,
      userName
    });
  }
  
  rejectMeasurementToPhase(measurementId: string, targetPhaseId: string, reason: string): Observable<MeasurementDto> {
    return this.http.post<MeasurementDto>(
      `${environment.apiBaseUrl}/measurements/${measurementId}/reject-to-phase`,
      { targetPhaseId, reason }
    );
  }
  
  markOrderAsComplete(orderId: string): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${environment.apiBaseUrl}/orders/${orderId}/mark-complete`, {});
  }

  getMeasurementsByOrderId(orderId: string): Observable<MeasurementDto[]> {
    return this.http.get<MeasurementDto[]>(`${environment.apiBaseUrl}/measurements/order/${orderId}`);
  }
} 