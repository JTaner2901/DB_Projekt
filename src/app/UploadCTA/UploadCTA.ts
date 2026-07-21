import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../auth/Auth';

@Component({
  selector: 'app-upload-cta',
  imports: [CommonModule, RouterLink],
  templateUrl: './UploadCTA.html',
  styleUrl: './UploadCTA.css'
})
export class UploadCTA {
  // Reihenfolge = Stapelreihenfolge, letztes Element liegt ganz oben
  stackedPhotos: string[] = [
    'https://picsum.photos/seed/stack1/400/500',
    'https://picsum.photos/seed/stack2/400/500',
    'https://picsum.photos/seed/stack3/400/500',
    '/easteregg/yunusamca.JPEG',
  ];

  constructor(public auth: Auth) {}
}