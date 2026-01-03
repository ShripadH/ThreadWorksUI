import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CompanyService, OrderDto, CompanyDto } from 'src/app/services/company.service';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderCreateModalComponent } from '../order-create-modal/order-create-modal.component';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  standalone: true,
  imports: [SHARED_IMPORTS, IonicModule, CommonModule, OrderCreateModalComponent],
})
export class OrderListComponent implements OnInit {
  orders: OrderDto[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';

  // Modal state for order creation
  showCreateOrderModal = false;
  companies: CompanyDto[] = [];
  preSelectedCompanyId: string | null = null;

  constructor(
    private companyService: CompanyService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.companyService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load orders.';
        this.loading = false;
      }
    });
    // Fetch companies for dropdown
    this.companyService.getAllCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
      }
    });
    // Listen for query param to open modal
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        this.preSelectedCompanyId = params['companyId'] || null;
        this.openCreateOrderModal();
      }
    });
  }

  openCreateOrderModal() {
    this.showCreateOrderModal = true;
  }

  closeCreateOrderModal() {
    this.showCreateOrderModal = false;
    this.preSelectedCompanyId = null;
    // Remove query param if present
    this.router.navigate([], { queryParams: { action: null, companyId: null }, queryParamsHandling: 'merge' });
  }

  onOrderCreated(order: OrderDto) {
    this.orders = [order, ...this.orders];
    this.closeCreateOrderModal();
  }

  get filteredOrders(): OrderDto[] {
    if (!this.searchTerm) return this.orders;
    const term = this.searchTerm.toLowerCase();
    return this.orders.filter(order => order.companyName.toLowerCase().includes(term));
  }

  goToDetails(order: OrderDto) {
    this.router.navigate(['/orders/details', order.id]);
  }
} 