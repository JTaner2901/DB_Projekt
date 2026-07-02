import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './Navbar.html',
  styleUrl: './Navbar.css'
})
export class Navbar {
  // Platzhalter - später durch echten Auth-Status (z.B. per Service/Signal) ersetzen
  isLoggedIn = false;

  isDropdownOpen = false;

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  logout(): void {
    // Platzhalter - später echten Logout-Call einbauen
    this.isLoggedIn = false;
    this.closeDropdown();
  }
}
