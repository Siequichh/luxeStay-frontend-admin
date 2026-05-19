import { Component, OnInit, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';

export interface MenuItem {
  label: string;
  icon: string;
  routerLink: string[];
  adminOnly: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, RippleModule, TooltipModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {

  private readonly allMenuItems: MenuItem[] = [
    { label: 'Dashboard',    icon: 'pi pi-home',        routerLink: ['/dashboard'], adminOnly: false },
    { label: 'Reservas',     icon: 'pi pi-calendar',    routerLink: ['/bookings'],  adminOnly: false },
    { label: 'Habitaciones', icon: 'pi pi-building',    routerLink: ['/rooms'],     adminOnly: false },
    { label: 'Usuarios',     icon: 'pi pi-users',       routerLink: ['/users'],     adminOnly: true  },
    { label: 'Hoteles',      icon: 'pi pi-map-marker',  routerLink: ['/hotels'],    adminOnly: false },
  ];

  private readonly titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/bookings':  'Gestión de Reservas',
    '/rooms':     'Habitaciones',
    '/users':     'Gestión de Usuarios',
    '/hotels':    'Hoteles',
  };

  menuItems = computed<MenuItem[]>(() => {
    const isAdmin = this.auth.currentUser()?.role === 'ADMIN';
    return isAdmin
      ? this.allMenuItems
      : this.allMenuItems.filter(item => !item.adminOnly);
  });

  isDark       = computed(() => this.layout.isDarkTheme());
  pageTitle    = signal<string>('Dashboard');
  sidebarOpen  = signal<boolean>(false);

  constructor(
    private auth: AuthService,
    private layout: LayoutService,
    private router: Router,
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe((e: any) => {
      const url = (e.urlAfterRedirects as string).split('?')[0];
      this.pageTitle.set(this.titleMap[url] ?? 'Dashboard');
      // Close sidebar on navigation (mobile)
      if (window.innerWidth <= 768) {
        this.sidebarOpen.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.layout.applyTheme();
    const url = this.router.url.split('?')[0];
    this.pageTitle.set(this.titleMap[url] ?? 'Dashboard');
  }

  @HostListener('window:resize')
  onResize(): void {
    // Auto-close sidebar overlay when viewport becomes desktop-sized
    if (window.innerWidth > 768) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  get userName(): string {
    return this.auth.currentUser()?.fullName ?? 'Admin';
  }

  get userRole(): string {
    const role = this.auth.currentUser()?.role ?? '';
    switch (role) {
      case 'ADMIN':         return 'Administrador';
      case 'HOTEL_MANAGER': return 'Gestor de Hotel';
      default:              return role;
    }
  }

  get userInitials(): string {
    const name  = this.userName;
    const parts = name.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  toggleDark(): void {
    this.layout.toggleDarkMode();
  }

  logout(): void {
    this.auth.logout();
  }
}
