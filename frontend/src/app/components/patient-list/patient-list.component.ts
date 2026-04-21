import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Patient } from '../../core/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PatientListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private cdr = inject(ChangeDetectorRef);
  
  patients: Patient[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    console.log('🔍 Fetching patients from mock service...');
    this.mockDataService.getPatients().subscribe({
      next: (data) => {
        console.log('✅ Data received:', data);
        console.log('📊 Number of patients:', data.length);
        this.patients = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = 'Failed to load patients';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredPatients(): Patient[] {
    if (!this.searchTerm) {
      return this.patients;
    }
    const term = this.searchTerm.toLowerCase();
    return this.patients.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.patient_id.toString().includes(term)
    );
  }
}
