import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, OrderDto, MeasurementDto } from 'src/app/services/company.service';
import { PhaseConfigService, PhaseConfig } from 'src/app/services/phase-config.service';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [SHARED_IMPORTS, IonicModule, CommonModule, FormsModule],
})
export class OrderDetailsComponent implements OnInit {
  order: OrderDto | null = null;
  loading = true;
  error: string | null = null;
  
  // Phase config data
  phaseConfigs: PhaseConfig[] = [];
  currentPhaseConfig: PhaseConfig | null = null;
  loadingPhases = false;
  phaseError: string | null = null;
  
  // Movement state
  movingPhase = false;
  
  // Skip phase functionality
  showSkipAlert = false;
  skipReason = '';
  skipAlertButtons: any[] = [];
  skipAlertInputs = [
    {
      name: 'skipReason',
      type: 'textarea',
      placeholder: 'Reason for skipping (required if skipping)'
    }
  ];
  
  // File upload properties
  selectedFile: File | null = null;
  uploading = false;
  uploadError: string | null = null;
  uploadSuccess: string | null = null;
  showUploadModeAlert = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  uploadModeButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.showUploadModeAlert = false;
        this.selectedFile = null;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      }
    },
    {
      text: 'Add to Existing',
      handler: () => {
        this.uploadFile('add');
      }
    },
    {
      text: 'Replace All',
      role: 'destructive',
      handler: () => {
        this.uploadFile('replace');
      }
    }
  ];
  
  // Measurements for measurement-level phases - NO LONGER NEEDED!
  // We get counts from order.phaseStates instead
  // measurements: MeasurementDto[] = [];
  // loadingMeasurements = false;

  constructor(
    private route: ActivatedRoute, 
    private companyService: CompanyService, 
    private router: Router,
    private phaseConfigService: PhaseConfigService
  ) {
    // Initialize skip alert buttons
    this.skipAlertButtons = [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          this.showSkipAlert = false;
          this.skipReason = '';
        }
      },
      {
        text: 'Complete',
        handler: () => {
          this.executePhaseMove();
        }
      },
      {
        text: 'Skip',
        handler: (data: any) => {
          if (!data.skipReason || data.skipReason.trim() === '') {
            return false;
          }
          this.executePhaseMove(data.skipReason);
          return true;
        }
      }
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'No order ID provided.';
        this.loading = false;
        return;
      }
      this.loading = true;
      this.loadOrderAndPhases(id);
    });
  }
  
  loadOrderAndPhases(orderId: string) {
    this.companyService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        
        // Load phase configs
        if (order.phaseConfigIds && order.phaseConfigIds.length > 0) {
          this.loadPhaseConfigs(order.phaseConfigIds);
        } else {
          this.loading = false;
        }
        
        // No longer need to load measurements - we use order.phaseStates!
        // this.loadMeasurements(orderId);
      },
      error: () => {
        this.error = 'Failed to load order details.';
        this.loading = false;
      }
    });
  }
  
  loadPhaseConfigs(phaseIds: string[]) {
    // Load all active phases and filter by order's phase IDs
    this.loadingPhases = true;
    this.phaseError = null;
    this.phaseConfigService.getAllActivePhases().subscribe({
      next: (allPhases) => {
        this.phaseConfigs = allPhases
          .filter(p => phaseIds.includes(p.id))
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder); // Sort by sequence
        
        // Find current phase config
        if (this.order?.currentPhaseId) {
          this.currentPhaseConfig = this.phaseConfigs.find(p => p.id === this.order?.currentPhaseId) || null;
        }
        
        console.log('Loaded phase configs:', this.phaseConfigs);
        console.log('Current phase:', this.currentPhaseConfig);
        console.log('Order:', this.order);
        
        this.loadingPhases = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load phase configurations:', err);
        this.phaseError = 'Failed to load phase configurations.';
        this.loadingPhases = false;
        this.loading = false;
      }
    });
  }
  
  // NO LONGER NEEDED - we use order.phaseStates for counts!
  /*
  loadMeasurements(orderId: string) {
    this.loadingMeasurements = true;
    this.companyService.getMeasurementsByOrderId(orderId).subscribe({
      next: (measurements) => {
        this.measurements = measurements;
        this.loadingMeasurements = false;
      },
      error: () => {
        this.loadingMeasurements = false;
      }
    });
  }
  */
  
  /**
   * Get count of measurements in a specific phase from order.phaseStates
   * This is efficient - no need to load all measurements!
   */
  getMeasurementCountForPhase(phaseId: string): number {
    if (!this.order?.phaseStates) {
      return 0;
    }
    const phaseState = this.order.phaseStates.find(ps => ps.phaseConfigId === phaseId);
    if (!phaseState) {
      return 0;
    }
    // Fallback: if count is not set, use measurementIds.length
    return phaseState.count || phaseState.measurementIds?.length || 0;
  }
  
  /**
   * Get total measurements count from order
   */
  getTotalMeasurements(): number {
    return this.order?.totalMeasurements || 0;
  }

  moveToNextPhase() {
    if (!this.order || !this.currentPhaseConfig) return;
    
    // For measurement-level phases, check if we should advance the order or manage items
    if (this.currentPhaseConfig.movementType === 'measurement-level') {
      // Check if all measurements have moved past this phase using phaseStates
      const measurementsInCurrentPhase = this.getMeasurementCountForPhase(this.currentPhaseConfig.id);
      const totalMeasurements = this.getTotalMeasurements();
      
      if (measurementsInCurrentPhase === 0 && totalMeasurements > 0) {
        // All measurements have moved forward - advance the order
        console.log('All measurements moved forward, advancing order phase');
        this.executePhaseMove();
      } else {
        // Some measurements still in current phase - navigate to manage them
        this.router.navigate(['/orders', this.order.id, 'phase-measurements']);
      }
      return;
    }
    
    // For order-level phases, move directly
    if (this.currentPhaseConfig.canSkip) {
      this.showSkipPrompt();
    } else {
      this.executePhaseMove();
    }
  }
  
  showSkipPrompt() {
    // Show alert to ask if user wants to skip or complete
    this.showSkipAlert = true;
  }
  
  executePhaseMove(skipReason?: string) {
    if (!this.order) return;
    
    this.movingPhase = true;
    this.companyService.moveOrderToNextPhase(this.order.id, skipReason).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.currentPhaseConfig = this.phaseConfigs.find(p => p.id === updatedOrder.currentPhaseId) || null;
        this.movingPhase = false;
        this.showSkipAlert = false;
        this.skipReason = '';
        
        // No longer reload measurements - order.phaseStates has the data!
        // if (this.order) {
        //   this.loadMeasurements(this.order.id);
        // }
      },
      error: () => {
        this.error = 'Failed to move to next phase.';
        this.movingPhase = false;
      }
    });
  }

  goToMeasurements(order: OrderDto) {
    this.router.navigate(['/measurements', order.id]);
  }
  
  viewPhaseMeasurements(phase: PhaseConfig) {
    if (!this.order) return;
    this.router.navigate(['/orders', this.order.id, 'phase-measurements'], {
      queryParams: { phaseId: phase.id }
    });
  }
  
  /**
   * Complete an order-level phase and move ALL measurements in that phase to the next phase
   */
  completePhaseAndMoveAllMeasurements(phase: PhaseConfig) {
    if (!this.order || !phase) return;
    
    // Get measurement IDs from order.phaseStates instead of loading all measurements
    const phaseState = this.order.phaseStates?.find(ps => ps.phaseConfigId === phase.id);
    const measurementIds = phaseState?.measurementIds || [];
    
    console.log(`🔄 Completing phase: ${phase.phaseName}`);
    console.log(`📊 Measurement IDs to move:`, measurementIds);
    console.log(`📊 Count: ${measurementIds.length}`);
    
    if (measurementIds.length === 0) {
      this.error = 'No measurements to move in this phase.';
      return;
    }
    
    // Find next phase
    const currentPhaseIndex = this.phaseConfigs.findIndex(p => p.id === phase.id);
    const nextPhase = this.phaseConfigs[currentPhaseIndex + 1];
    
    if (!nextPhase) {
      this.error = 'No next phase available.';
      return;
    }
    
    console.log(`➡️ Next phase: ${nextPhase.phaseName}`);
    
    this.movingPhase = true;
    this.error = null;
    
    console.log(`⏳ Moving ${measurementIds.length} measurements in bulk (single API call)...`);
    
    // Use bulk API to move all measurements in a single transaction
    this.companyService.bulkMoveMeasurementsToNextPhase(measurementIds, undefined, undefined).subscribe({
      next: (result) => {
        console.log(`✅ Bulk move completed:`, result);
        console.log(`✅ ${result.successCount} succeeded, ${result.failCount} failed out of ${measurementIds.length} total`);
        
        // Reload order to refresh phaseStates
        if (this.order) {
          console.log('🔄 Reloading order data...');
          this.loadOrderAndPhases(this.order.id);
        }
        this.movingPhase = false;
        
        if (result.failCount > 0) {
          this.error = result.message;
        }
      },
      error: (err) => {
        console.error('❌ Bulk move failed:', err);
        this.error = 'Failed to move measurements to next phase.';
        this.movingPhase = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError = null;
      this.uploadSuccess = null;
      // Show alert to ask user: add or replace
      this.showUploadModeAlert = true;
    }
  }

  uploadFile(mode: 'add' | 'replace') {
    if (!this.selectedFile || !this.order) return;
    
    this.showUploadModeAlert = false;
    this.uploading = true;
    this.uploadError = null;
    this.uploadSuccess = null;

    this.companyService.uploadMeasurements(
      this.order.id, 
      this.order.companyId, 
      this.selectedFile,
      mode
    ).subscribe({
      next: (response: any) => {
        this.uploading = false;
        this.uploadSuccess = `Successfully uploaded ${response.numberOfAddedRecords} measurements (${mode === 'replace' ? 'replaced all' : 'added to existing'}).`;
        this.selectedFile = null;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        
        // No longer reload measurements - order.phaseStates has the data!
        // if (this.order) {
        //   this.loadMeasurements(this.order.id);
        // }
      },
      error: (error) => {
        this.uploading = false;
        this.uploadError = 'Failed to upload measurements file.';
        this.selectedFile = null;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
      }
    });
  }
  
  getPhaseStatus(phase: PhaseConfig): 'completed' | 'current' | 'skipped' | 'pending' {
    if (!this.order) return 'pending';
    
    // Check if explicitly skipped
    if (this.order.skippedPhases?.some(sp => sp.phaseId === phase.id)) {
      return 'skipped';
    }
    
    // Use phaseState.status from backend if available
    if (this.order.phaseStates) {
      const phaseState = this.order.phaseStates.find(ps => ps.phaseConfigId === phase.id);
      if (phaseState && phaseState.status) {
        // Map backend status to UI status
        if (phaseState.status === 'completed') return 'completed';
        if (phaseState.status === 'in-progress') return 'current';
        if (phaseState.status === 'skipped') return 'skipped';
        if (phaseState.status === 'pending') return 'pending';
      }
    }
    
    // Fallback: Use measurement counts if phaseState.status is not available
    const count = this.getMeasurementCountForPhase(phase.id);
    
    if (count > 0) {
      return 'current';  // Phase has measurements = "In Progress"
    }
    
    // Check if explicitly in completedPhaseIds
    if (this.order.completedPhaseIds?.includes(phase.id)) {
      return 'completed';
    }
    
    // Find the first phase with measurements
    let firstPhaseWithMeasurements: PhaseConfig | null = null;
    for (const p of this.phaseConfigs) {
      if (this.getMeasurementCountForPhase(p.id) > 0) {
        firstPhaseWithMeasurements = p;
        break;
      }
    }
    
    if (firstPhaseWithMeasurements) {
      const firstPhaseIndex = this.phaseConfigs.findIndex(p => p.id === firstPhaseWithMeasurements!.id);
      const thisPhaseIndex = this.phaseConfigs.findIndex(p => p.id === phase.id);
      
      if (thisPhaseIndex < firstPhaseIndex) {
        return 'completed';  // Phase is before the first phase with measurements
      }
    }
    
    return 'pending';
  }
  
  isLastPhase(): boolean {
    if (!this.order || !this.currentPhaseConfig || this.phaseConfigs.length === 0) return true;
    const currentIndex = this.phaseConfigs.findIndex(p => p.id === this.order?.currentPhaseId);
    return currentIndex === -1 || currentIndex === this.phaseConfigs.length - 1;
  }
  
  /**
   * Check if all measurements are in the last phase (ready to complete order)
   */
  isReadyToComplete(): boolean {
    if (!this.order || this.phaseConfigs.length === 0) return false;
    
    const lastPhase = this.phaseConfigs[this.phaseConfigs.length - 1];
    const lastPhaseCount = this.getMeasurementCountForPhase(lastPhase.id);
    const totalCount = this.getTotalMeasurements();
    
    // Order is ready to complete if all measurements are in the last phase
    return lastPhaseCount === totalCount && totalCount > 0;
  }
  
  /**
   * Mark order as complete
   */
  markOrderComplete() {
    if (!this.order) return;
    
    this.movingPhase = true;
    this.companyService.markOrderAsComplete(this.order.id).subscribe({
      next: (updatedOrder) => {
        this.order = updatedOrder;
        this.movingPhase = false;
        // Show success message
        alert('Order marked as complete!');
      },
      error: (err) => {
        console.error('Failed to mark order as complete:', err);
        this.error = 'Failed to mark order as complete.';
        this.movingPhase = false;
      }
    });
  }
} 