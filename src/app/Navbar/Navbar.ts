import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../auth/Auth';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './Navbar.html',
  styleUrl: './Navbar.css'
})
export class Navbar {
  isDropdownOpen = false;

  constructor(public auth: Auth) {}

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