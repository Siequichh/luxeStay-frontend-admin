import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService, UserSummary, CreateUserRequest } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, PasswordModule,
    SelectModule, TagModule, CardModule, MessageModule, DialogModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {

  users: UserSummary[] = [];
  loading = false;
  showDialog = false;
  saving = false;
  errorMsg = '';

  form: CreateUserRequest = {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'HOTEL_MANAGER',
  };

  roleOptions = [
    { label: 'Gestor de Hotel', value: 'HOTEL_MANAGER' },
    { label: 'Administrador',   value: 'ADMIN' },
  ];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.listUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la lista de usuarios',
        });
      },
    });
  }

  openNewUserDialog(): void {
    this.form = { fullName: '', email: '', password: '', phone: '', role: 'HOTEL_MANAGER' };
    this.errorMsg = '';
    this.showDialog = true;
  }

  saveUser(): void {
    this.errorMsg = '';
    this.saving = true;

    const req: CreateUserRequest = {
      ...this.form,
      phone: this.form.phone?.trim() || undefined,
    };

    this.userService.createUser(req).subscribe({
      next: (created) => {
        this.users = [...this.users, created];
        this.showDialog = false;
        this.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Usuario creado',
          detail: `${created.fullName} fue creado correctamente`,
        });
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Error al crear el usuario';
        this.saving = false;
      },
    });
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'ADMIN':         return 'Administrador';
      case 'HOTEL_MANAGER': return 'Gestor de Hotel';
      default:              return role;
    }
  }

  roleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (role) {
      case 'ADMIN':         return 'danger';
      case 'HOTEL_MANAGER': return 'info';
      default:              return 'secondary';
    }
  }

  providerLabel(provider: string): string {
    return provider === 'GOOGLE' ? 'Google' : 'Local';
  }
}
