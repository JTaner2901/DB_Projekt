import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.services';
import { Auth } from '../auth/Auth';

const API_BASE = 'http://localhost:3000';

// Alle Infos für das Detail-Modal - kommt vom erweiterten
// Endpoint GET /api/photos/:id (siehe Hinweis im Chat zur ApiService-Ergänzung)
interface PhotoDetailData {
  id: number;
  url: string;
  photographer: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  camera: string;
  lens: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  focalLength: string;
  resolution: string;
  categories: string[];
  likes: number;
  liked: boolean;
}

@Component({
  selector: 'app-photo-detail',
  imports: [CommonModule],
  templateUrl: './PhotoDetail.html',
  styleUrl: './PhotoDetail.css',
})
export class PhotoDetail implements OnChanges {
  @Input() photoId: number | null = null;
  @Output() close = new EventEmitter<void>();

  photo: PhotoDetailData | null = null;
  isLoading = false;
  errorMsg = '';

  // steuert die Schließen-Animation, bevor das Modal wirklich aus dem DOM verschwindet
  isClosing = false;

  // Instagram-artiger Herz-Burst bei Doppelklick aufs Bild
  showHeartBurst = false;
  private heartBurstTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor(private api: ApiService, private auth: Auth) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['photoId']) return;

    if (this.photoId !== null) {
      this.isClosing = false;
      this.ladeDetails(this.photoId);
      document.body.style.overflow = 'hidden'; // Hintergrund nicht mitscrollen
    } else {
      document.body.style.overflow = '';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.photoId !== null && !this.isClosing) {
      this.requestClose();
    }
  }

  private ladeDetails(id: number): void {
    this.isLoading = true;
    this.errorMsg = '';
    this.photo = null;

    // Hinweis: getPhoto() liefert (wie auch getPhotos() in Explore) den
    // Liked-Status aktuell nicht userspezifisch mit - der wird erst nach
    // dem ersten Klick auf den Like-Button über toggleLike() bekannt.
    this.api.getPhoto(id).subscribe({
      next: (p: any) => {
        this.photo = this.mapPhoto(p, id);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Foto-Details konnten nicht geladen werden', err);
        this.errorMsg = 'Dieses Foto konnte nicht geladen werden.';
        this.isLoading = false;
      },
    });
  }

  private mapPhoto(p: any, fallbackId: number): PhotoDetailData {
    return {
      id: p.photo_Id ?? fallbackId,
      url: p.Bildpfad ? `${API_BASE}/${p.Bildpfad}` : 'https://picsum.photos/800/600',
      photographer: p.Benutzername || 'Unbekannt',
      title: p.Titel || '',
      description: p.Beschreibung || '',
      location: p.Location || '',
      createdAt: p.Datum || '',
      camera: p.Kamera || '',
      lens: p.Objektiv || '',
      aperture: p.Blende ? `f/${p.Blende}` : '',
      shutterSpeed: p.Shutterspeed || '',
      iso: p.Iso ? `ISO ${p.Iso}` : '',
      focalLength: p.Brennweite ? `${p.Brennweite} mm` : '',
      resolution: p.Auflösung || '',
      categories: p.kategorien
        ? String(p.kategorien).split(',').map((k: string) => k.trim()).filter(Boolean)
        : [],
      likes: p.likes ?? 0,
      liked: p.liked ?? false,
    };
  }

  // Nur die Specs anzeigen, die das Backend tatsächlich mitliefert
  // (z.B. wenn nicht jedes Foto Einstellungen hinterlegt hat)
  get specEntries(): { label: string; value: string; icon: string }[] {
    if (!this.photo) return [];
    const alle = [
      { label: 'Kamera', value: this.photo.camera, icon: 'ti-camera' },
      { label: 'Objektiv', value: this.photo.lens, icon: 'ti-aperture' },
      { label: 'Blende', value: this.photo.aperture, icon: 'ti-circle-dashed' },
      { label: 'Belichtung', value: this.photo.shutterSpeed, icon: 'ti-clock' },
      { label: 'ISO', value: this.photo.iso, icon: 'ti-sun' },
      { label: 'Brennweite', value: this.photo.focalLength, icon: 'ti-focus-2' },
      { label: 'Auflösung', value: this.photo.resolution, icon: 'ti-photo' },
    ];
    return alle.filter((e) => !!e.value);
  }

  onBackdropClick(): void {
    this.requestClose();
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  requestClose(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    clearTimeout(this.closeTimer);
    // Dauer muss zur CSS-Schließanimation (pd-dialog-out / pd-fade-out) passen
    this.closeTimer = setTimeout(() => {
      document.body.style.overflow = '';
      this.close.emit();
    }, 220);
  }

  // Doppelklick aufs Bild = liken + Herz-Animation, wie man es von Instagram kennt
  onImageDoubleClick(): void {
    if (!this.photo) return;
    if (!this.photo.liked) {
      this.toggleLike();
    }
    this.triggerHeartBurst();
  }

  private triggerHeartBurst(): void {
    this.showHeartBurst = false;
    // kurzer Reflow-Trick, damit die Animation auch bei schnellem Mehrfach-Doppelklick neu startet
    requestAnimationFrame(() => {
      this.showHeartBurst = true;
      clearTimeout(this.heartBurstTimer);
      this.heartBurstTimer = setTimeout(() => (this.showHeartBurst = false), 700);
    });
  }

  toggleLike(): void {
    if (!this.photo) return;
    const benutzer = this.auth.currentUser();
    if (!benutzer) {
      alert('Bitte melde dich an, um Fotos zu liken.');
      return;
    }

    this.api.toggleLike(this.photo.id, benutzer.user_Id).subscribe({
      next: (antwort: { liked: boolean; likes: number }) => {
        if (!this.photo) return;
        this.photo.liked = antwort.liked;
        this.photo.likes = antwort.likes;
      },
      error: (err: any) => console.error('Like fehlgeschlagen', err),
    });
  }
}