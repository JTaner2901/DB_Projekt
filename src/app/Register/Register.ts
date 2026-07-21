import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GridMotion } from '../GridMotion/GridMotion';
import { Auth } from '../auth/Auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink, GridMotion],
  templateUrl: './Register.html',
  styleUrl: './Register.css'
})
export class Register {
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';

  constructor(private auth: Auth, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    this.auth.register(this.email, this.password).subscribe({
      next: (antwort) => {
        // Direkt einloggen - Benutzername ist noch null, das Profil-Setup
        // übernimmt der Guard automatisch als nächste Seite.
        this.auth.setEingeloggt(antwort);
        this.router.navigateByUrl('/profil-einrichten');
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Registrierung fehlgeschlagen.';
      },
    });
  }
}