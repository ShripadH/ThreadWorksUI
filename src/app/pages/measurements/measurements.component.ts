import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { ActivatedRoute } from '@angular/router';
import { MeasurementsService, MeasurementDto } from 'src/app/services/measurements.service';
import { AlertController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-measurements',
  templateUrl: './measurements.component.html',
  styleUrls: ['./measurements.component.scss'],
  standalone: true,
  imports: [SHARED_IMPORTS],
})
export class MeasurementsComponent  implements OnInit {
  orderId: string | null = null;
  measurements: MeasurementDto[] = [];
  expandedIndex: number | null = null;
  loading = true;
  error: string | null = null;
  searchTerm: string = '';
  editingMeasurement: MeasurementDto | null = null;
  editForm: any = {};
  showEditModal = false;
  savingEdit = false;

  // Map of categories to their fields
  fieldCategories: { [category: string]: string[] } = {
    'Apron': [
      'apronLength', 'apronSleeveLength', 'apronHalfQty', 'apronFullQty'
    ],
    'Full Shirt': [
      'shirtLength', 'chest', 'stomach', 'shoulder', 'fullSleeveLength', 'fullShirtQty', 'shirtNotes'
    ],
    'Half Shirt': [
      'halfSleeveLength', 'halfShirtQty'
    ],
    'Shirt': [
      'tShirtSize', 'shirtNotes'
    ],
    'Tshirt': [
      'tShirtSize', 'tShirtQty'
    ],
    'Trousers': [
      'trousersLength', 'trousersWaist', 'trousersSeat', 'trousersBottomRound', 'trousersKneeRound', 'trousersThigh', 'trousersFullRise', 'trousersPleatWP', 'trousersPocket', 'trousersQty', 'trousersNotes'
    ]
  };

  editCategoryFields: { [category: string]: { key: string, value: any }[] } = {};

  constructor(
    private route: ActivatedRoute,
    private measurementsService: MeasurementsService,
    private alertController: AlertController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('orderId');
    if (this.orderId) {
      this.loading = true;
      this.measurementsService.getMeasurementsByOrderId(this.orderId).subscribe({
        next: (data) => {
          this.measurements = data;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load measurements.';
          this.loading = false;
        }
      });
    }
  }

  toggleExpand(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  async deleteMeasurement(measurement: MeasurementDto, index: number) {
    console.log('Delete clicked', measurement, index);
    const alert = await this.alertController.create({
      header: 'Delete Measurement',
      message: `Are you sure you want to delete measurement for ${measurement.employeeName}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.loading = true;
            this.measurementsService.deleteMeasurement(measurement.id).subscribe({
              next: (res) => {
                console.log('Delete success', res);
                this.measurements.splice(index, 1);
                this.loading = false;
                if (this.expandedIndex === index) this.expandedIndex = null;
                this.error = null;
              },
              error: (err) => {
                console.error('Delete error', err);
                this.error = 'Failed to delete measurement.';
                this.loading = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  editMeasurement(measurement: MeasurementDto) {
    console.log('Edit clicked', measurement);
    this.editingMeasurement = measurement;
    this.editForm = { ...measurement };
    this.showEditModal = true;
    this.editCategoryFields = {};
    for (const category of Object.keys(this.fieldCategories)) {
      this.editCategoryFields[category] = this.getFieldsByCategory(this.editForm, category);
    }
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editingMeasurement = null;
    this.editForm = {};
  }

  saveEdit() {
    if (!this.editingMeasurement) return;
    this.savingEdit = true;
    this.measurementsService.updateMeasurement(this.editingMeasurement.id, this.editForm).subscribe({
      next: (updated: any) => {
        if (this.editingMeasurement) {
          Object.assign(this.editingMeasurement, this.editForm);
        }
        this.savingEdit = false;
        this.showEditModal = false;
        this.editingMeasurement = null;
        this.editForm = {};
      },
      error: () => {
        this.error = 'Failed to update measurement.';
        this.savingEdit = false;
      }
    });
  }

  getFieldsByCategory(measurement: MeasurementDto, category: string) {
    return this.fieldCategories[category]
      .filter(field => measurement[field] !== undefined && measurement[field] !== null && measurement[field] !== '')
      .map(field => ({ key: field, value: measurement[field] }));
  }

  get filteredMeasurements(): MeasurementDto[] {
    if (!this.searchTerm) return this.measurements;
    const term = this.searchTerm.toLowerCase();
    return this.measurements.filter(m =>
      (m.employeeName && m.employeeName.toLowerCase().includes(term)) ||
      (m.empId && m.empId.toLowerCase().includes(term)) ||
      (m.prodSr !== undefined && m.prodSr !== null && m.prodSr.toString().includes(term))
    );
  }
}
