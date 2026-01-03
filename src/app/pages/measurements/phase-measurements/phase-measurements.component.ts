import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, OrderDto, MeasurementDto } from 'src/app/services/company.service';
import { PhaseConfigService, PhaseConfig } from 'src/app/services/phase-config.service';

@Component({
  selector: 'app-phase-measurements',
  templateUrl: './phase-measurements.component.html',
  styleUrls: ['./phase-measurements.component.scss'],
  standalone: true,
  imports: [SHARED_IMPORTS, IonicModule, CommonModule, FormsModule],
})
export class PhaseMeasurementsComponent implements OnInit {
  order: OrderDto | null = null;
  measurements: MeasurementDto[] = [];
  currentPhase: PhaseConfig | null = null;
  selectedPhase: PhaseConfig | null = null; // NEW: Allow phase selection
  allPhases: PhaseConfig[] = [];
  previousPhases: PhaseConfig[] = [];
  
  loading = true;
  error: string | null = null;
  movingMeasurementId: string | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
    private phaseConfigService: PhaseConfigService,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const orderId = params.get('orderId');
      if (!orderId) {
        this.error = 'No order ID provided.';
        this.loading = false;
        return;
      }
      this.loadOrderAndMeasurements(orderId);
    });
  }
  
  loadOrderAndMeasurements(orderId: string) {
    this.loading = true;
    
    // Load order
    this.companyService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        console.log('📋 Order loaded:', order);
        console.log('📋 Order current phase:', order.currentPhaseId);
        
        // Load measurements
        this.companyService.getMeasurementsByOrderId(orderId).subscribe({
          next: (measurements) => {
            this.measurements = measurements;
            console.log('📊 Total measurements loaded:', measurements.length);
            console.log('📊 Sample measurement:', measurements[0]);
            
            // Log how many measurements have phase info
            const withPhase = measurements.filter(m => m.currentPhaseId).length;
            const withoutPhase = measurements.length - withPhase;
            console.log(`✅ Measurements WITH phase: ${withPhase}`);
            console.log(`❌ Measurements WITHOUT phase: ${withoutPhase}`);
            
            // Load phase configs
            if (order.phaseConfigIds && order.phaseConfigIds.length > 0) {
              this.loadPhaseConfigs(order.phaseConfigIds);
            } else {
              this.loading = false;
            }
          },
          error: () => {
            this.error = 'Failed to load measurements.';
            this.loading = false;
          }
        });
      },
      error: () => {
        this.error = 'Failed to load order.';
        this.loading = false;
      }
    });
  }
  
  loadPhaseConfigs(phaseIds: string[]) {
    this.phaseConfigService.getAllActivePhases().subscribe({
      next: (allPhases) => {
        this.allPhases = allPhases
          .filter(p => phaseIds.includes(p.id))
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        
        // Find current phase
        if (this.order?.currentPhaseId) {
          this.currentPhase = this.allPhases.find(p => p.id === this.order?.currentPhaseId) || null;
          
          // Get all previous phases (for QC rejection)
          if (this.currentPhase) {
            this.previousPhases = this.allPhases.filter(p => 
              p.sequenceOrder < this.currentPhase!.sequenceOrder
            );
          }
        }
        
        // Check if phaseId was passed in query params
        this.route.queryParams.subscribe(params => {
          const passedPhaseId = params['phaseId'];
          if (passedPhaseId) {
            // Set selected phase to the passed phase
            this.selectedPhase = this.allPhases.find(p => p.id === passedPhaseId) || this.currentPhase;
            console.log('✅ Using passed phaseId:', passedPhaseId);
            console.log('✅ Selected phase:', this.selectedPhase?.phaseName);
          } else {
            // Default to current phase
            this.selectedPhase = this.currentPhase;
            console.log('✅ Using current phase:', this.currentPhase?.phaseName);
          }
          
          // Update previous phases for rejection based on selected phase
          if (this.selectedPhase) {
            this.previousPhases = this.allPhases.filter(p => 
              p.sequenceOrder < this.selectedPhase!.sequenceOrder
            );
          }
        });
        
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load phase configurations.';
        this.loading = false;
      }
    });
  }
  
  changePhase(phase: PhaseConfig) {
    this.selectedPhase = phase;
    // Update previous phases for rejection based on selected phase
    if (this.selectedPhase) {
      this.previousPhases = this.allPhases.filter(p => 
        p.sequenceOrder < this.selectedPhase!.sequenceOrder
      );
    }
  }
  
  getMeasurementsInCurrentPhase(): MeasurementDto[] {
    if (!this.selectedPhase) {
      console.log('⚠️ No phase selected');
      return [];
    }
    
    const filtered = this.measurements.filter(m => m.currentPhaseId === this.selectedPhase!.id);
    console.log(`🔍 Filtering measurements for phase: ${this.selectedPhase.phaseName} (${this.selectedPhase.id})`);
    console.log(`🔍 Total measurements: ${this.measurements.length}`);
    console.log(`🔍 Measurements in this phase: ${filtered.length}`);
    
    // Show which phases measurements are in
    const phaseDistribution = this.measurements.reduce((acc: any, m) => {
      const phaseId = m.currentPhaseId || 'NO_PHASE';
      acc[phaseId] = (acc[phaseId] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Measurement distribution by phase:', phaseDistribution);
    
    return filtered;
  }
  
  getMeasurementCountByPhase(phase: PhaseConfig): number {
    return this.measurements.filter(m => m.currentPhaseId === phase.id).length;
  }
  
  async moveToNextPhase(measurement: MeasurementDto) {
    if (!this.selectedPhase) return;
    
    if (this.selectedPhase.canSkip) {
      this.showSkipAlert(measurement);
    } else {
      this.executeMoveToNextPhase(measurement.id);
    }
  }
  
  async showSkipAlert(measurement: MeasurementDto) {
    const alert = await this.alertController.create({
      header: 'Move to Next Phase',
      message: 'Complete or skip this phase for this measurement?',
      inputs: [
        {
          name: 'skipReason',
          type: 'textarea',
          placeholder: 'Reason for skipping (required if skipping)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Complete',
          handler: () => {
            this.executeMoveToNextPhase(measurement.id);
          }
        },
        {
          text: 'Skip',
          handler: (data) => {
            if (!data.skipReason || data.skipReason.trim() === '') {
              return false;
            }
            this.executeMoveToNextPhase(measurement.id, data.skipReason);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
  
  executeMoveToNextPhase(measurementId: string, skipReason?: string) {
    this.movingMeasurementId = measurementId;
    
    this.companyService.moveMeasurementToNextPhase(measurementId, skipReason).subscribe({
      next: (updatedMeasurement) => {
        // Update measurement in list
        const index = this.measurements.findIndex(m => m.id === measurementId);
        if (index > -1) {
          const oldPhaseId = this.measurements[index].currentPhaseId;
          this.measurements[index] = updatedMeasurement;
          
          // Find the phase names for user feedback
          const oldPhase = this.allPhases.find(p => p.id === oldPhaseId);
          const newPhase = this.allPhases.find(p => p.id === updatedMeasurement.currentPhaseId);
          
          console.log(`✅ Moved measurement from ${oldPhase?.phaseName} to ${newPhase?.phaseName}`);
          
          // Show success toast
          this.showToast(`Moved to ${newPhase?.phaseName || 'next phase'}`, 'success');
        }
        this.movingMeasurementId = null;
      },
      error: (err) => {
        console.error('Failed to move measurement:', err);
        this.error = 'Failed to move measurement to next phase: ' + (err.error?.message || err.message);
        this.showToast('Failed to move measurement', 'danger');
        this.movingMeasurementId = null;
      }
    });
  }
  
  async showToast(message: string, color: string = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.color = color;
    toast.position = 'top';
    document.body.appendChild(toast);
    await toast.present();
  }
  
  async rejectToPreviousPhase(measurement: MeasurementDto) {
    if (this.previousPhases.length === 0) {
      const alert = await this.alertController.create({
        header: 'Cannot Reject',
        message: 'No previous phases available to reject to.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }
    
    const inputs = this.previousPhases.map(phase => ({
      name: phase.id,
      type: 'radio' as const,
      label: phase.phaseName,
      value: phase.id
    }));
    
    const alert = await this.alertController.create({
      header: 'Reject to Phase',
      message: 'Select the phase to reject this measurement to:',
      inputs: [
        ...inputs,
        {
          name: 'reason',
          type: 'textarea' as const,
          placeholder: 'Reason for rejection (required)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reject',
          role: 'destructive',
          handler: (data) => {
            const selectedPhaseId = this.previousPhases.find(p => data[p.id])?.id;
            if (!selectedPhaseId || !data.reason || data.reason.trim() === '') {
              return false;
            }
            this.executeReject(measurement.id, selectedPhaseId, data.reason);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }
  
  executeReject(measurementId: string, targetPhaseId: string, reason: string) {
    this.movingMeasurementId = measurementId;
    
    this.companyService.rejectMeasurementToPhase(measurementId, targetPhaseId, reason).subscribe({
      next: (updatedMeasurement) => {
        // Update measurement in list
        const index = this.measurements.findIndex(m => m.id === measurementId);
        if (index > -1) {
          const oldPhaseId = this.measurements[index].currentPhaseId;
          this.measurements[index] = updatedMeasurement;
          
          // Find the phase names for user feedback
          const oldPhase = this.allPhases.find(p => p.id === oldPhaseId);
          const targetPhase = this.allPhases.find(p => p.id === targetPhaseId);
          
          console.log(`❌ Rejected measurement from ${oldPhase?.phaseName} to ${targetPhase?.phaseName}`);
          
          // Show success toast
          this.showToast(`Rejected to ${targetPhase?.phaseName || 'previous phase'}`, 'warning');
        }
        this.movingMeasurementId = null;
      },
      error: (err) => {
        console.error('Failed to reject measurement:', err);
        this.error = 'Failed to reject measurement: ' + (err.error?.message || err.message);
        this.showToast('Failed to reject measurement', 'danger');
        this.movingMeasurementId = null;
      }
    });
  }
  
  goBack() {
    if (this.order) {
      this.router.navigate(['/orders/details', this.order.id]);
    } else {
      this.router.navigate(['/orders']);
    }
  }
}

