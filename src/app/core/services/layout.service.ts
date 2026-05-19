import { Injectable, signal } from '@angular/core';

const DARK_KEY = 'luxestay_admin_dark';

@Injectable({ providedIn: 'root' })
export class LayoutService {

  isDarkTheme = signal<boolean>(this.loadPreference());

  toggleDarkMode(): void {
    const next = !this.isDarkTheme();
    this.isDarkTheme.set(next);
    localStorage.setItem(DARK_KEY, String(next));
    this.applyClass(next);
  }

  applyTheme(): void {
    this.applyClass(this.isDarkTheme());
  }

  private applyClass(dark: boolean): void {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('app-dark');
    } else {
      root.classList.remove('app-dark');
    }
  }

  private loadPreference(): boolean {
    const stored = localStorage.getItem(DARK_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
