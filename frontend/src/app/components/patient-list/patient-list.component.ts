import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../core/services/patient.service';
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
  private patientService = inject(PatientService);
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
    
    this.patientService.getPatients().subscribe({
      next: (data) => {
        this.patients = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
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
