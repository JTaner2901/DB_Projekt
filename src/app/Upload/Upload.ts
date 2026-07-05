import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.services';
import { Auth } from '../auth/Auth';

interface Kategorie {
  KategorieID: number;
  Name: string;
}

@Component({
  selector: 'app-upload',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Upload.html',
  styleUrl: './Upload.css'
})
export class UploadPage implements OnInit {
  isDragging = false;
  previewUrl: string | null = null;
  fileName: string | null = null;
  selectedFile: File | null = null;

  title = '';
  description = '';
  categoryId: number | null = null;
  location = '';
  iso = '';
  aperture = '';
  shutter = '';
  cameraBody = '';
  lens = '';
  tags: string[] = [];
  tagInput = '';

  categories: Kategorie[] = [];
  errorMessage = '';
  isSubmitting = false; // verhindert Doppel-Klicks während des Uploads

  constructor(
    private api: ApiService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (daten) => (this.categories = daten),
      error: (err) => console.error('Kategorien konnten nicht geladen werden', err),
    });
  }

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
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePreview(): void {
    this.previewUrl = null;
    this.fileName = null;
    this.selectedFile = null;
  }

  addTag(): void {
    const value = this.tagInput.trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter((t) => t !== tag);
  }

  // Entfernt alles außer Ziffern und Trennzeichen (z.B. "f/2,8" -> "2.8")
  // So ist es egal, ob jemand "2.8", "2,8" oder "f/2.8" eintippt.
  private nurZahl(wert: string): string {
    if (!wert) return '';
    return wert
      .replace(',', '.')       // Komma -> Punkt
      .replace(/[^0-9.]/g, ''); // alles außer Ziffern und Punkt entfernen
  }

  onPublish(): void {
    this.errorMessage = '';

    const benutzer = this.auth.currentUser();
    if (!benutzer) {
      this.errorMessage = 'Du musst eingeloggt sein, um ein Foto hochzuladen.';
      return;
    }
    if (!this.title.trim()) {
      this.errorMessage = 'Bitte gib einen Titel ein.';
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('user_Id', String(benutzer.user_Id));
    formData.append('Titel', this.title.trim());
    formData.append('Beschreibung', this.description?.trim() || '');
    formData.append('Datum', new Date().toISOString().slice(0, 10));
    formData.append('Location', this.location?.trim() || '');

    if (this.categoryId) {
      formData.append('kategorien', JSON.stringify([this.categoryId]));
    }

    // Nur Werte mitschicken, die auch wirklich ausgefüllt wurden.
    // Leere Felder werden zu null statt zu einem leeren String "" zu werden,
    // was bei Zahlen-Spalten (ISO, Blende) sonst einen SQL-Fehler auslöst.
    const einstellungen: Record<string, string | number | null> = {
      Blende: this.aperture ? this.nurZahl(this.aperture) : null,
      Shutterspeed: this.shutter?.trim() || null,
      ISO: this.iso ? Number(this.nurZahl(this.iso)) : null,
      Objektiv: this.lens?.trim() || null,
    };
    formData.append('einstellungen', JSON.stringify(einstellungen));

    if (this.selectedFile) {
      formData.append('bild', this.selectedFile);
    }

    this.api.uploadPhoto(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Upload-Fehler:', err); // vollen Fehler in der Browser-Konsole sichtbar machen
        this.errorMessage = err.error?.error || 'Hochladen fehlgeschlagen.';
      },
    });
  }
}