import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 11000;">
      <div *ngFor="let toast of toastService.allToasts()" 
           class="toast show" 
           [class.bg-success]="toast.type === 'success'"
           [class.bg-danger]="toast.type === 'error'"
           [class.bg-warning]="toast.type === 'warning'"
           [class.bg-info]="toast.type === 'info'"
           [class.text-white]="toast.type !== 'warning'"
           role="alert">
        <div class="toast-header">
          <strong class="me-auto">
            <span *ngIf="toast.type === 'success'">✅ Success</span>
            <span *ngIf="toast.type === 'error'">❌ Error</span>
            <span *ngIf="toast.type === 'warning'">⚠️ Warning</span>
            <span *ngIf="toast.type === 'info'">ℹ️ Info</span>
          </strong>
          <button type="button" 
                  class="btn-close" 
                  (click)="toastService.remove(toast.id)"
                  aria-label="Close"></button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 300px;
      margin-bottom: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .toast.bg-success .toast-header,
    .toast.bg-danger .toast-header,
    .toast.bg-info .toast-header {
      background-color: rgba(255, 255, 255, 0.95);
    }

    .toast.bg-warning .toast-header {
      background-color: rgba(255, 255, 255, 0.95);
    }

    .toast-body {
      font-size: 0.95rem;
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
