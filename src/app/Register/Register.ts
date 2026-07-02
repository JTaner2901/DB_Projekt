import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GridMotion } from '../GridMotion/GridMotion';

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

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      console.log('Passwörter stimmen nicht überein');
      return;
    }
    // Platzhalter - später echten Register-API-Call einbauen
    console.log('Registrierung mit:', this.username, this.email, this.password);
  }
}
