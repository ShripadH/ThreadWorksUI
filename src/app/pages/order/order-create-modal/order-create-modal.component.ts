import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CompanyDto, OrderDto, CompanyService } from 'src/app/services/company.service';
import { PhaseConfigService, PhaseConfig } from 'src/app/services/phase-config.service';

@Component({
  selector: 'app-order-create-modal',
  templateUrl: './order-create-modal.component.html',
  styleUrls: ['./order-create-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class OrderCreateModalComponent implements OnInit, OnChanges {
  @Input() companies: CompanyDto[] = [];
  @Input() companyId: string | null = null;
  @Input() isOpen = false;
  @Output() didDismiss = new EventEmitter<void>();
  @Output() orderCreated = new EventEmitter<OrderDto>();

  newOrder: Partial<OrderDto> = {
    companyId: '',
    orderDate: '',
    completionDate: '',
    deliveryDate: '',
    phaseConfigIds: []
  };
  creatingOrder = false;
  createOrderError: string | null = null;
  selectedPhaseIds: string[] = [];
  selectedFile: File | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // Phase config data
  phaseConfigs: PhaseConfig[] = [];
  phasesByCategory: {[category: string]: PhaseConfig[]} = {};
  loadingPhases = false;

  constructor(
    private companyService: CompanyService, 
    private router: Router,
    private phaseConfigService: PhaseConfigService
  ) {}

  ngOnInit() {
    if (this.companyId) {
      this.newOrder.companyId = this.companyId;
    }
    this.loadPhaseConfigs();
  }

  ngOnChanges() {
    if (this.companyId) {
      this.newOrder.companyId = this.companyId;
    }
    if (this.isOpen && this.phaseConfigs.length === 0) {
      this.loadPhaseConfigs();
    }
  }
  
  loadPhaseConfigs() {
    this.loadingPhases = true;
    this.phaseConfigService.getPhasesByCategories().subscribe({
      next: (groupedPhases) => {
        this.phasesByCategory = groupedPhases;
        // Flatten to get all phases
        this.phaseConfigs = Object.values(groupedPhases).reduce((acc, phases) => acc.concat(phases), []);
        
        // Pre-select mandatory phases
        const mandatoryPhaseIds = this.phaseConfigs
          .filter(p => p.isMandatory)
          .map(p => p.id);
        this.selectedPhaseIds = [...mandatoryPhaseIds];
        
        this.loadingPhases = false;
      },
      error: () => {
        this.createOrderError = 'Failed to load phase configurations.';
        this.loadingPhases = false;
      }
    });
  }

  close() {
    this.didDismiss.emit();
    this.createOrderError = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  submit() {
    if (!this.newOrder.companyId || !this.newOrder.orderDate) {
      this.createOrderError = 'Please select a company and order date.';
      return;
    }
    
    if (this.selectedPhaseIds.length === 0) {
      this.createOrderError = 'Please select at least one phase.';
      return;
    }
    
    this.creatingOrder = true;
    const payload = {
      ...this.newOrder,
      phaseConfigIds: this.selectedPhaseIds,
      completedPhaseIds: [],
      currentPhaseId: this.selectedPhaseIds[0] // Set first phase as current
    };
    
    this.companyService.createOrder(payload).subscribe({
      next: (created) => {
        // If a file is selected, upload measurements after creating the order
        if (this.selectedFile && created.companyId) {
          this.companyService.uploadMeasurements(created.id, created.companyId, this.selectedFile).subscribe({
            next: () => {
              this.orderCreated.emit(created);
              this.creatingOrder = false;
              this.createOrderError = null;
              this.close();
            },
            error: () => {
              this.createOrderError = 'Order created but failed to upload measurements file.';
              this.creatingOrder = false;
              // Still emit the order created event even if file upload fails
              this.orderCreated.emit(created);
            }
          });
        } else {
          // No file selected, just emit the created order
          this.orderCreated.emit(created);
          this.creatingOrder = false;
          this.createOrderError = null;
          this.close();
        }
      },
      error: () => {
        this.createOrderError = 'Failed to create order.';
        this.creatingOrder = false;
      }
    });
  }

  get companyName(): string {
    if (!this.companyId) return '';
    const company = this.companies.find(c => c.id === this.companyId);
    return company ? company.companyName : '';
  }

  onPhaseToggle(phaseId: string, checked: boolean) {
    const phase = this.phaseConfigs.find(p => p.id === phaseId);
    
    // Don't allow unchecking mandatory phases
    if (!checked && phase?.isMandatory) {
      this.createOrderError = 'Cannot uncheck mandatory phases.';
      setTimeout(() => this.createOrderError = null, 3000);
      return;
    }
    
    if (checked) {
      if (!this.selectedPhaseIds.includes(phaseId)) {
        this.selectedPhaseIds.push(phaseId);
      }
    } else {
      this.selectedPhaseIds = this.selectedPhaseIds.filter(id => id !== phaseId);
    }
  }

  navigateToCompanyPage() {
    this.close();
    this.router.navigate(['/company'], { queryParams: { action: 'add', returnTo: 'orders' } });
  }
  
  getCategoryKeys(): string[] {
    return Object.keys(this.phasesByCategory);
  }
} 