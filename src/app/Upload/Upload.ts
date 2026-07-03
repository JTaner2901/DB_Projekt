import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Upload.html',
  styleUrl: './Upload.css'
})
export class UploadPage {
  isDragging = false;
  previewUrl: string | null = null;
  fileName: string | null = null;

  title = '';
  description = '';
  category = '';
  location = '';

  iso = '';
  aperture = '';
  shutter = '';
  cameraBody = '';
  lens = '';

  tags: string[] = [];
  tagInput = '';

  categories = ['Nature', 'Architecture', 'People', 'Fashion', 'Art'];

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Platzhalter - später hier automatisch EXIF-Daten (Kamera, ISO, Blende...) auslesen
  }

  removePreview(): void {
    this.previewUrl = null;
    this.fileName = null;
  }

  addTag(): void {
    const value = this.tagInput.trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onPublish(): void {
    // Platzhalter - später echten Upload-API-Call einbauen
    console.log('Veröffentliche Foto:', {
      title: this.title,
      description: this.description,
      category: this.category,
      location: this.location,
      iso: this.iso,
      aperture: this.aperture,
      shutter: this.shutter,
      cameraBody: this.cameraBody,
      lens: this.lens,
      tags: this.tags,
      fileName: this.fileName,
    });
  }
}
