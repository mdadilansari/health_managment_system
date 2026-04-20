import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { Patient } from '../../core/models/patient.model';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class PatientListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private cdr = inject(ChangeDetectorRef);
  
  patients: Patient[] = [];
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
}
