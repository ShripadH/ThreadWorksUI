import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhaseConfigService, PhaseConfig } from 'src/app/services/phase-config.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-phase-config-list',
  templateUrl: './phase-config-list.component.html',
  standalone: true,
  imports: [SHARED_IMPORTS, IonicModule, CommonModule, FormsModule],
})
export class PhaseConfigListComponent implements OnInit {
  phaseConfigs: PhaseConfig[] = [];
  loading = false;
  error: string | null = null;
  
  // Modal state
  showModal = false;
  isEdit = false;
  modalPhase: Partial<PhaseConfig> = this.getEmptyPhase();
  
  categories = ['Order Management', 'Material Management', 'Production', 'QA & Post-production', 'Dispatch'];
  movementTypes = ['order-level', 'measurement-level'];
  
  showDeleteAlert = false;
  selectedPhase: PhaseConfig | null = null;
  deleteAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.showDeleteAlert = false;
        this.selectedPhase = null;
      }
    },
    {
      text: 'Deactivate',
      role: 'destructive',
      handler: () => {
        if (this.selectedPhase) {
          this.deletePhase(this.selectedPhase);
        }
        this.showDeleteAlert = false;
        this.selectedPhase = null;
      }
    }
  ];

  constructor(private phaseConfigService: PhaseConfigService, private router: Router) {}

  ngOnInit() {
    this.loadPhaseConfigs();
  }

  loadPhaseConfigs() {
    this.loading = true;
    this.error = null;
    this.phaseConfigService.getAllPhases().subscribe({
      next: (data) => {
        this.phaseConfigs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load phase configurations.';
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.isEdit = false;
    this.modalPhase = this.getEmptyPhase();
    this.showModal = true;
  }

  openEditModal(phase: PhaseConfig) {
    this.isEdit = true;
    this.modalPhase = { ...phase };
    this.showModal = true;
  }

  savePhase() {
    if (this.isEdit && this.modalPhase.id) {
      this.phaseConfigService.updatePhase(this.modalPhase.id, this.modalPhase).subscribe({
        next: (updated) => {
          const idx = this.phaseConfigs.findIndex(p => p.id === updated.id);
          if (idx > -1) this.phaseConfigs[idx] = updated;
          this.showModal = false;
        },
        error: () => {
          this.error = 'Failed to update phase configuration.';
        }
      });
    } else {
      this.phaseConfigService.createPhase(this.modalPhase).subscribe({
        next: (created) => {
          this.phaseConfigs = [...this.phaseConfigs, created];
          this.showModal = false;
        },
        error: () => {
          this.error = 'Failed to create phase configuration.';
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
  }

  confirmDeletePhase(phase: PhaseConfig) {
    this.selectedPhase = phase;
    this.showDeleteAlert = true;
  }

  deletePhase(phase: PhaseConfig) {
    this.phaseConfigService.deletePhase(phase.id).subscribe({
      next: () => {
        const idx = this.phaseConfigs.findIndex(p => p.id === phase.id);
        if (idx > -1) {
          this.phaseConfigs[idx].isActive = false;
        }
      },
      error: () => {
        this.error = 'Failed to deactivate phase configuration.';
      }
    });
  }

  initializeDefaults() {
    this.phaseConfigService.initializeDefaults().subscribe({
      next: () => {
        this.loadPhaseConfigs();
      },
      error: () => {
        this.error = 'Failed to initialize default phases.';
      }
    });
  }

  private getEmptyPhase(): Partial<PhaseConfig> {
    return {
      phaseName: '',
      phaseKey: '',
      isMandatory: false,
      movementType: 'order-level',
      category: 'Order Management',
      icon: '📦',
      canSkip: false,
      sequenceOrder: this.phaseConfigs.length + 1,
      prerequisites: [],
      canRunInParallel: false,
      isActive: true
    };
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}


