import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <div class="card shadow-lg">
            <div class="card-body p-5">
              <div class="mb-4">
                <i class="bi bi-shield-exclamation" style="font-size: 5rem; color: #dc3545;"></i>
              </div>
              <h1 class="display-4 text-danger mb-3">Access Denied</h1>
              <p class="lead text-muted mb-4">
                You don't have permission to access this page.
              </p>
              <p class="text-muted mb-4">
                This resource requires specific role permissions. Please contact your administrator if you believe you should have access.
              </p>
              <a routerLink="/dashboard" class="btn btn-primary btn-lg">
                <i class="bi bi-house-door"></i> Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      border: none;
      border-radius: 15px;
    }
  `]
})
export class UnauthorizedComponent {}
