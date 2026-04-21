import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DoctorListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  private cdr = inject(ChangeDetectorRef);
  
  doctors: Doctor[] = [];
  allDoctors: Doctor[] = [];
  departments: string[] = [];
  selectedDepartment: string = '';
  searchTerm: string = '';
  loading: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDoctors();
  }

  loadDepartments(): void {
    this.mockDataService.getDepartments().subscribe({
      next: (data) => {
        this.departments = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });
  }

  loadDoctors(department?: string): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    this.mockDataService.getDoctors(department).subscribe({
      next: (data) => {
        this.doctors = [...data];
        if (!department) {
          this.allDoctors = [...data];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load doctors';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error loading doctors:', err);
      }
    });
  }

  onDepartmentChange(): void {
    if (this.selectedDepartment === '') {
      this.loadDoctors();
    } else {
      this.loadDoctors(this.selectedDepartment);
    }
  }

  get filteredDoctors(): Doctor[] {
    if (!this.searchTerm) {
      return this.doctors;
    }
    const term = this.searchTerm.toLowerCase();
    return this.doctors.filter(d => 
      d.name.toLowerCase().includes(term) ||
      d.email.toLowerCase().includes(term) ||
      d.phone.includes(term) ||
      d.specialization.toLowerCase().includes(term) ||
      d.doctor_id.toString().includes(term)
    );
  }
}
