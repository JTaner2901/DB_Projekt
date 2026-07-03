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
    console.log('onSubmit ausgelöst mit:', this.email, this.password);
    const success = this.auth.login(this.email, this.password);
    console.log('Login erfolgreich?', success);

    if (success) {
      this.errorMessage = '';
      this.router.navigateByUrl('/');
    } else {
      this.errorMessage = 'Falscher Nutzername oder falsches Passwort.';
    }
  }
}