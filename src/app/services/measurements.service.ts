import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface MeasurementDto {
  id: string;
  orderId: string;
  companyId: string;
  empId: string;
  employeeName: string;
  department: string;
  prodSr: number;
  // Add more fields as needed for measurements
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class MeasurementsService {
  constructor(private http: HttpClient) {}

  getMeasurementsByOrderId(orderId: string): Observable<MeasurementDto[]> {
    return this.http.get<MeasurementDto[]>(`${environment.apiBaseUrl}/measurements/order/${orderId}`);
  }

  updateMeasurement(id: string, measurement: Partial<MeasurementDto>) {
    return this.http.put(`${environment.apiBaseUrl}/measurements/${id}`, measurement);
  }

  deleteMeasurement(id: string) {
    return this.http.delete(`${environment.apiBaseUrl}/measurements/${id}`);
  }
} 