import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [SHARED_IMPORTS],
})
export class DashboardComponent  implements OnInit {
  summary: any = null;
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.loading = true;
    this.http.get(`${environment.apiBaseUrl}/dashboard/summary`).subscribe({
      next: (data) => {
        this.summary = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard stats.';
        this.loading = false;
      }
    });
  }

  get totalMeasurements(): number {
    return this.summary?.workshopSnapshot?.reduce((sum: number, row: any) => sum + row.count, 0) || 0;
  }

  get deliveredCount(): number {
    return this.summary?.workshopSnapshot?.find((row: any) => row.state === 'DELIVERED')?.count || 0;
  }

  get phaseCompletionPercent(): number {
    return this.totalMeasurements ? (this.deliveredCount / this.totalMeasurements) : 0;
  }

  goToCompanies() {
    this.router.navigate(['/company']);
  }

  goToOrders() {
    this.router.navigate(['/orders']);
  }

  addCompany() {
    this.router.navigate(['/company'], { queryParams: { action: 'add' } });
  }

  createOrder() {
    this.router.navigate(['/orders'], { queryParams: { action: 'create' } });
  }
  
  configurePhases() {
    this.router.navigate(['/admin/phase-configs']);
  }
}
