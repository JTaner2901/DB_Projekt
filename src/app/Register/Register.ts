import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GridMotion } from '../GridMotion/GridMotion';
import { ApiService } from '../services/api.services';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink, GridMotion],
  templateUrl: './Register.html',
  styleUrl: './Register.css'
})
export class Register {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    this.api.register({
      Email: this.email,
      Benutzername: this.username,
      Passwort: this.password,
    }).subscribe({
      next: () => {
        // Registrierung erfolgreich -> zur Login-Seite weiterleiten
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        // z.B. 409, wenn die Email schon vergeben ist (siehe dein Backend)
        this.errorMessage = err.error?.error || 'Registrierung fehlgeschlagen.';
      },
    });
  }
}