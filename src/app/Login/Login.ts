import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GridMotion } from '../GridMotion/GridMotion';
import { Auth } from '../auth/Auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, GridMotion],
  templateUrl: './Login.html',
  styleUrl: './Login.css'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private auth: Auth, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = ''; // alte Fehlermeldung zuerst löschen

    this.auth.login(this.email, this.password).subscribe({
      // next: läuft, wenn die API erfolgreich geantwortet hat (Status 200)
      next: (antwort) => {
        this.auth.setEingeloggt(antwort); // { user_Id, Benutzername, Email }
        this.router.navigateByUrl('/');
      },
      // error: läuft, wenn die API einen Fehler zurückgibt (z.B. 401 falsches Passwort)
      error: (err) => {
        this.errorMessage = err.error?.error || 'Anmeldung fehlgeschlagen.';
      },
    });
  }
}