import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DoctorListComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  doctors: Doctor[] = [];
  allDoctors: Doctor[] = [];
  departments: string[] = [];
  selectedDepartment: string = '';
  searchTerm: string = '';
  loading: boolean = true;
  error: string = '';
  saving: boolean = false;

  // Modal state
  showModal: boolean = false;
  editingDoctor: Doctor | null = null;
  doctorForm: FormGroup;

  constructor() {
    this.doctorForm = this.fb.group({
      name:           ['', [Validators.required, Validators.minLength(2)]],
      email:          ['', [Validators.required, Validators.email]],
      phone:          ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      department:     ['', Validators.required],
      specialization: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDoctors();
  }

  canManage(): boolean {
    return this.authService.hasRole(['admin', 'reception']);
  }

  loadDepartments(): void {
    this.doctorService.getDepartments().subscribe({
      next: (data) => {
        this.departments = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading departments:', err)
    });
  }

  loadDoctors(department?: string): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    
    this.doctorService.getDoctors(department).subscribe({
      next: (data) => {
        this.doctors = [...data];
        if (!department) this.allDoctors = [...data];
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

  openAddModal(): void {
    this.editingDoctor = null;
    this.doctorForm.reset();
    this.showModal = true;
  }

  openEditModal(doctor: Doctor): void {
    this.editingDoctor = doctor;
    this.doctorForm.patchValue({
      name:           doctor.name,
      email:          doctor.email,
      phone:          doctor.phone,
      department:     doctor.department,
      specialization: doctor.specialization,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingDoctor = null;
    this.doctorForm.reset();
  }

  saveDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const data = this.doctorForm.value;

    const obs = this.editingDoctor
      ? this.doctorService.updateDoctor(this.editingDoctor.doctor_id, data)
      : this.doctorService.createDoctor(data);

    obs.subscribe({
      next: (result) => {
        this.saving = false;
        if (this.editingDoctor) {
          const idx = this.doctors.findIndex(d => d.doctor_id === this.editingDoctor!.doctor_id);
          if (idx > -1) this.doctors[idx] = result;
          this.doctors = [...this.doctors];
          this.toastService.success(`Dr. ${result.name} updated successfully`);
        } else {
          this.doctors = [result, ...this.doctors];
          this.toastService.success(`Dr. ${result.name} added successfully`);
        }
        this.closeModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err?.error?.error || 'Failed to save doctor');
        this.cdr.detectChanges();
      }
    });
  }

  deleteDoctor(doctor: Doctor): void {
    if (!confirm(`Delete Dr. ${doctor.name}? This cannot be undone.`)) return;

    this.doctorService.deleteDoctor(doctor.doctor_id).subscribe({
      next: () => {
        this.doctors = this.doctors.filter(d => d.doctor_id !== doctor.doctor_id);
        this.toastService.success(`Dr. ${doctor.name} deleted`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error(err?.error?.error || 'Failed to delete doctor');
      }
    });
  }

  get filteredDoctors(): Doctor[] {
    if (!this.searchTerm) return this.doctors;
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
