import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GridMotion } from '../GridMotion/GridMotion';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, GridMotion],
  templateUrl: './Login.html',
  styleUrl: './Login.css'
})
export class Login {
  email = '';
  password = '';

  onSubmit(): void {
    // Platzhalter - später echten Login-API-Call einbauen
    console.log('Login mit:', this.email, this.password);
  }
}