import { Component, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from 'src/app/shared/shared.imports';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService, CompanyDto } from '../../../services/company.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  standalone: true,
  imports: [SHARED_IMPORTS, IonicModule, CommonModule, FormsModule],
  styles: [`
    ion-searchbar.custom-searchbar {
      --background: #fff;
      --box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --border-radius: 9999px;
      padding: 0;
    }
  `]
})
export class CompanyListComponent implements OnInit {
  companies: CompanyDto[] = [];
  loading = false;
  error: string | null = null;

  // Modal state
  showModal = false;
  isEdit = false;
  modalCompany: CompanyDto = this.getEmptyCompany();

  searchTerm: string = '';

  showDeleteAlert = false;
  selectedCompany: CompanyDto | null = null;
  deleteAlertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        this.showDeleteAlert = false;
        this.selectedCompany = null;
      }
    },
    {
      text: 'Delete',
      role: 'destructive',
      handler: () => {
        if (this.selectedCompany) {
          this.deleteCompany(this.selectedCompany);
        }
        this.showDeleteAlert = false;
        this.selectedCompany = null;
      }
    }
  ];

  constructor(private companyService: CompanyService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.loadCompanies();
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.openAddCompanyModal();
      }
    });
  }

  loadCompanies() {
    this.loading = true;
    this.error = null;
    this.companyService.getAllCompanies().subscribe({
      next: (data) => {
        this.companies = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load companies.';
        this.loading = false;
      }
    });
  }

  openAddCompanyModal() {
    this.isEdit = false;
    this.modalCompany = this.getEmptyCompany();
    this.showModal = true;
  }

  openEditCompanyModal(company: CompanyDto) {
    this.isEdit = true;
    this.modalCompany = { ...company };
    this.showModal = true;
  }

  saveCompany() {
    if (this.isEdit) {
      this.companyService.updateCompany(this.modalCompany.id, this.modalCompany).subscribe({
        next: (updated) => {
          const idx = this.companies.findIndex(c => c.id === updated.id);
          if (idx > -1) this.companies[idx] = updated;
          this.showModal = false;
        },
        error: () => {
          this.error = 'Failed to update company.';
        }
      });
    } else {
      const { id, ...companyData } = this.modalCompany;
      this.companyService.createCompany(companyData as any).subscribe({
        next: (created) => {
          this.companies = [...this.companies, created];
          this.showModal = false;
          
          // Check if we should redirect back to orders page
          this.route.queryParams.subscribe(params => {
            if (params['returnTo'] === 'orders') {
              // Navigate to orders page with action to create order and pre-select this company
              this.router.navigate(['/orders'], { 
                queryParams: { 
                  action: 'create', 
                  companyId: created.id 
                } 
              });
            }
          }).unsubscribe();
        },
        error: () => {
          this.error = 'Failed to add company.';
        }
      });
    }
  }

  closeModal() {
    this.showModal = false;
  }

  get filteredCompanies(): CompanyDto[] {
    if (!this.searchTerm) return this.companies;
    const term = this.searchTerm.toLowerCase();
    return this.companies.filter(company =>
      company.companyName.toLowerCase().includes(term) ||
      company.companyDescription.toLowerCase().includes(term) ||
      company.contactPerson.toLowerCase().includes(term) ||
      company.contactNumber.toLowerCase().includes(term) ||
      company.notes.toLowerCase().includes(term)
    );
  }

  private getEmptyCompany(): CompanyDto {
    return {
      id: '',
      companyName: '',
      companyDescription: '',
      notes: '',
      contactPerson: '',
      contactNumber: '',
    };
  }

  confirmDeleteCompany(company: CompanyDto) {
    this.selectedCompany = company;
    this.showDeleteAlert = true;
  }

  deleteCompany(company: CompanyDto) {
    this.companyService.deleteCompany(company.id).subscribe({
      next: () => {
        this.companies = this.companies.filter(c => c.id !== company.id);
      },
      error: () => {
        this.error = 'Failed to delete company.';
      }
    });
  }

  getAvatarBg(company: CompanyDto): string {
    // Example: Use different backgrounds based on company name/type
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

  goToDetails(company: CompanyDto) {
    this.router.navigate(['/company/details', company.id]);
  }
}
