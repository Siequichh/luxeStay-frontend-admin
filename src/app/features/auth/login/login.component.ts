import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService, LoginRequest } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, PasswordModule, MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = { email: '', password: '' };
  loading  = false;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private layout: LayoutService,
  ) {}

  ngOnInit(): void {
    this.layout.applyTheme();
  }

  onSubmit(): void {
    this.loading  = true;
    this.errorMsg = '';

    this.auth.login(this.credentials).subscribe({
      next: () => {
        const role = this.auth.currentUser()?.role;
        if (role !== 'ADMIN' && role !== 'HOTEL_MANAGER') {
          this.auth.logout();
          this.errorMsg = 'Acceso denegado. Este panel es exclusivo para administradores y gestores de hotel.';
          this.loading  = false;
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Credenciales incorrectas';
        this.loading  = false;
      },
    });
  }
}
