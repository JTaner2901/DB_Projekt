import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../auth/Auth';

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './Navbar.html',
  styleUrl: './Navbar.css'
})
export class Navbar {
  isDropdownOpen = false;

  constructor(public auth: Auth) {}

  get avatarUrl(): string | null {
    const pfad = this.auth.currentUser()?.Profilbildpfad;
    return pfad ? `${API_BASE}/${pfad}` : null;
  }

  // Fallback, falls kein Profilbild hinterlegt ist - erster Buchstabe des Namens
  get initial(): string {
    const name = this.auth.currentUser()?.Benutzername;
    return name ? name[0].toUpperCase() : '?';
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.closeDropdown();
  }
}