import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface PhaseConfig {
  id: string;
  phaseName: string;
  phaseKey: string;
  isMandatory: boolean;
  movementType: 'order-level' | 'measurement-level';
  category: string;
  icon: string;
  canSkip: boolean;
  sequenceOrder: number;
  prerequisites: string[];
  canRunInParallel: boolean;
  isActive: boolean;
}

export interface SkippedPhase {
  phaseId: string;
  phaseName: string;
  reason: string;
  skippedAt: Date;
  skippedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhaseConfigService {
  private baseUrl = `${environment.apiBaseUrl}/phase-configs`;

  constructor(private http: HttpClient) {}

  // Get all active phase configurations
  getAllActivePhases(): Observable<PhaseConfig[]> {
    return this.http.get<PhaseConfig[]>(`${this.baseUrl}/active`);
  }

  // Get all phases (including inactive)
  getAllPhases(): Observable<PhaseConfig[]> {
    return this.http.get<PhaseConfig[]>(this.baseUrl);
  }

  // Get phase by ID
  getPhaseById(id: string): Observable<PhaseConfig> {
    return this.http.get<PhaseConfig>(`${this.baseUrl}/${id}`);
  }

  // Get phase by key
  getPhaseByKey(phaseKey: string): Observable<PhaseConfig> {
    return this.http.get<PhaseConfig>(`${this.baseUrl}/key/${phaseKey}`);
  }

  // Get mandatory phases
  getMandatoryPhases(): Observable<PhaseConfig[]> {
    return this.http.get<PhaseConfig[]>(`${this.baseUrl}/mandatory`);
  }

  // Get phases grouped by category
  getPhasesByCategories(): Observable<{[category: string]: PhaseConfig[]}> {
    return this.http.get<{[category: string]: PhaseConfig[]}>(`${this.baseUrl}/by-category`);
  }

  // Get phases by specific category
  getPhasesByCategory(category: string): Observable<PhaseConfig[]> {
    return this.http.get<PhaseConfig[]>(`${this.baseUrl}/category/${category}`);
  }

  // Create new phase configuration
  createPhase(phaseConfig: Partial<PhaseConfig>): Observable<PhaseConfig> {
    return this.http.post<PhaseConfig>(this.baseUrl, phaseConfig);
  }

  // Update phase configuration
  updatePhase(id: string, phaseConfig: Partial<PhaseConfig>): Observable<PhaseConfig> {
    return this.http.put<PhaseConfig>(`${this.baseUrl}/${id}`, phaseConfig);
  }

  // Soft delete phase (set inactive)
  deletePhase(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Hard delete phase (permanent)
  hardDeletePhase(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/hard`);
  }

  // Initialize default phases
  initializeDefaults(): Observable<any> {
    return this.http.post(`${this.baseUrl}/initialize-defaults`, {});
  }

  // Validate if can move to phase
  validatePhaseMove(targetPhaseId: string, completedPhaseIds: string[]): Observable<{canMove: boolean, message: string}> {
    return this.http.post<{canMove: boolean, message: string}>(`${this.baseUrl}/validate-move?targetPhaseId=${targetPhaseId}`, completedPhaseIds);
  }
}


