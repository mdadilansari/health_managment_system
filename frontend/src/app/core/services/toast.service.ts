import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autohide?: boolean;
  delay?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private nextId = 1;

  public readonly allToasts = this.toasts.asReadonly();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', delay: number = 5000): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      type,
      autohide: true,
      delay
    };

    this.toasts.update(toasts => [...toasts, toast]);

    if (toast.autohide && toast.delay) {
      setTimeout(() => this.remove(toast.id), toast.delay);
    }
  }

  success(message: string, delay: number = 5000): void {
    this.show(message, 'success', delay);
  }

  error(message: string, delay: number = 5000): void {
    this.show(message, 'error', delay);
  }

  warning(message: string, delay: number = 5000): void {
    this.show(message, 'warning', delay);
  }

  info(message: string, delay: number = 5000): void {
    this.show(message, 'info', delay);
  }

  remove(id: number): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
