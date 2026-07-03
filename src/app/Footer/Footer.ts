import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterLink],
  templateUrl: './Footer.html',
  styleUrl: './Footer.css'
})
export class Footer {
  currentYear = new Date().getFullYear();

  categories = ['Nature', 'Architecture', 'People', 'Fashion', 'Art'];

  team = [
    'Yunus Malik Bezeyis',
    'Juan-Taner Allerborn',
    'Engin Budak',
  ];
}
