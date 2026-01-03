import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, CompanyDto, OrderDto } from '../../../services/company.service';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { formatDate } from '@angular/common';
import { OrderCreateModalComponent } from '../../order/order-create-modal/order-create-modal.component';

@Component({
  selector: 'app-company-details',
  templateUrl: './company-details.component.html',
  standalone: true,
  imports: [SHARED_IMPORTS, IonicModule, CommonModule, FormsModule, OrderCreateModalComponent],
})
export class CompanyDetailsComponent implements OnInit {
  company: CompanyDto | null = null;
  orders: OrderDto[] = [];
  loading = true;
  error: string | null = null;
  ordersLoading = false;
  ordersError: string | null = null;
  showOrderModal = false;
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  orderForm = {
    orderDate: '',
    completionDate: '',
    deliveryDate: '',
    status: ''
  };
  orderUploading = false;
  orderUploadError: string | null = null;
  selectedPhases: string[] = [];

  constructor(private companyService: CompanyService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'No company ID provided.';
        this.loading = false;
        return;
      }
      this.loading = true;
      this.companyService.getCompanyById(id).subscribe({
        next: (company) => {
          this.company = company;
          this.loading = false;
          this.fetchOrders(company.id);
        },
        error: () => {
          this.error = 'Failed to load company details.';
          this.loading = false;
        }
      });
    });
  }

  fetchOrders(companyId: string) {
    this.ordersLoading = true;
    this.ordersError = null;
    this.companyService.getOrdersByCompanyId(companyId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.ordersLoading = false;
      },
      error: () => {
        this.ordersError = 'Failed to load orders.';
        this.ordersLoading = false;
      }
    }); 
  }

  openOrderModal() {
    this.showOrderModal = true;
  }

  closeOrderModal() {
    this.showOrderModal = false;
  }

  onOrderCreated(order: OrderDto) {
    if (this.company) {
      this.fetchOrders(this.company.id);
    }
    this.closeOrderModal();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  async uploadOrderFile() {
    if (!this.selectedFile || !this.company) return;
    this.orderUploading = true;
    this.orderUploadError = null;
    // 1. Create order
    const orderPayload = {
      companyId: this.company.id,
      companyName: this.company.companyName,
      orderDate: this.orderForm.orderDate,
      completionDate: this.orderForm.completionDate,
      deliveryDate: this.orderForm.deliveryDate,
      status: 'Order Recieved',
      phases: this.selectedPhases
    };
    this.companyService.createOrder(orderPayload).subscribe({
      next: (order: any) => {
        // 2. Upload Excel file for measurements
        this.companyService.uploadMeasurements(order.id, this.company!.id, this.selectedFile!).subscribe({
          next: () => {
            this.orderUploading = false;
            this.closeOrderModal();
            this.fetchOrders(this.company!.id); // Refresh orders
          },
          error: () => {
            this.orderUploading = false;
            this.orderUploadError = 'Failed to upload measurements file.';
          }
        });
      },
      error: () => {
        this.orderUploading = false;
        this.orderUploadError = 'Failed to create order.';
      }
    });
  }

  getAvatarBg(company: CompanyDto): string {
    if (company.companyName.toLowerCase().includes('textile')) return '#e3f0ff'; // blue
    if (company.companyName.toLowerCase().includes('fashion')) return '#eafbe7'; // green
    if (company.companyName.toLowerCase().includes('metro')) return '#f3e8ff'; // purple
    return '#f0f0f0'; // default grey
  }

  getAvatarColor(company: CompanyDto): string {
    if (company.companyName.toLowerCase().includes('textile')) return '#3a8bfd'; // blue
    if (company.companyName.toLowerCase().includes('fashion')) return '#34c759'; // green
    if (company.companyName.toLowerCase().includes('metro')) return '#a259ff'; // purple
    return '#888'; // default grey
  }

  goToOrderDetails(order: OrderDto) {
    this.router.navigate(['/orders/details', order.id]);
  }

  onPhaseToggle(phaseKey: string, checked: boolean) {
    if (checked) {
      if (!this.selectedPhases.includes(phaseKey)) {
        this.selectedPhases.push(phaseKey);
      }
    } else {
      this.selectedPhases = this.selectedPhases.filter(key => key !== phaseKey);
    }
  }
}
