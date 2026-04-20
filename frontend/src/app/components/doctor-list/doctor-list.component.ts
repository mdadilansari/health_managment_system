import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.css']
})
export class DoctorListComponent implements OnInit {
  private mockDataService = inject(MockDataService);
  
  doctors: Doctor[] = [];
  departments: string[] = [];
  selectedDepartment: string = '';
  loading: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDoctors();
  }

  loadDepartments(): void {
    this.mockDataService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data;
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });
  }

  loadDoctors(department?: string): void {
    this.loading = true;
    this.mockDataService.getDoctors(department).subscribe({
      next: (data) => {
        this.doctors = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load doctors';
        this.loading = false;
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
}
