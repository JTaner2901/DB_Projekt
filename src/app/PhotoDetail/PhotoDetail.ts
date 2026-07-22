import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../services/api.services';
import { WebsocketService, WsMessage } from '../services/websocket.service';
import { Auth } from '../auth/Auth';
import { bildUrl } from '../shared/bild-url';

const API_BASE = 'http://localhost:3000';

interface PhotoData {
  photo_Id: number;
  user_Id: number;
  Titel: string;
  Beschreibung: string;
  Datum: string;
  Location: string;
  Bildpfad: string;
  Benutzername: string;
  Hersteller: string | null;
  Modell: string | null;
  Blende: number | null;
  Shutterspeed: string | null;
  ISO: number | null;
  Brennweite: number | null;
  Aufloesung: string | null;
  Objektiv: string | null;
  Kategorien: string[];
}

type ModalStatus = 'idle' | 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-photo-detail',
  imports: [CommonModule],
  templateUrl: './PhotoDetail.html',
  styleUrl: './PhotoDetail.css'
})
export class PhotoDetail implements OnChanges, OnDestroy {
  @Input() photoId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() photoDeleted = new EventEmitter<number>();

  // Alles, was sich async ändert und im Template angezeigt wird, als Signal -
  // behebt zuverlässig Change-Detection-Probleme (siehe NG0100 vorhin bei Discover)
  photo = signal<PhotoData | null>(null);
  imageUrl = signal('');
  imageFailed = signal(false);
  likes = signal(0);
  liked = signal(false);
  status = signal<ModalStatus>('idle');

  private wsSubscription?: Subscription;

  constructor(
    private api: ApiService,
    public auth: Auth,
    private ws: WebsocketService,
  ) {
    // Live mitbekommen, wenn jemand anders das gerade offene Foto liked
    // oder löscht, während das Modal offen ist.
    this.ws.connect();
    this.wsSubscription = this.ws.messages.subscribe((msg) => this.handleWsMessage(msg));
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  ngOnChanges(): void {
    if (this.photoId) {
      this.ladeAlles(this.photoId);
    } else {
      this.status.set('idle');
      this.photo.set(null);
    }
  }

  get kameraLabel(): string | null {
    const p = this.photo();
    if (!p?.Hersteller && !p?.Modell) return null;
    return [p?.Hersteller, p?.Modell].filter(Boolean).join(' ');
  }

  get specItems(): { label: string; value: string }[] {
    const p = this.photo();
    if (!p) return [];
    const items: { label: string; value: string }[] = [];
    if (p.ISO) items.push({ label: 'ISO', value: String(p.ISO) });
    if (p.Blende) items.push({ label: 'Blende', value: `f/${p.Blende}` });
    if (p.Shutterspeed) items.push({ label: 'Shutter', value: p.Shutterspeed });
    if (p.Brennweite) items.push({ label: 'Brennweite', value: `${p.Brennweite}mm` });
    if (p.Objektiv) items.push({ label: 'Objektiv', value: p.Objektiv });
    if (p.Aufloesung) items.push({ label: 'Auflösung', value: p.Aufloesung });
    return items;
  }

  private ladeAlles(id: number): void {
    this.status.set('loading');
    this.photo.set(null);
    this.imageUrl.set('');
    this.imageFailed.set(false);

    const benutzer = this.auth.currentUser();

    forkJoin({
      photo: this.api.getPhoto(id),
      likesRes: this.api.getLikes(id, benutzer?.user_Id),
    }).subscribe({
      next: ({ photo, likesRes }: { photo: PhotoData; likesRes: { likes: number; liked: boolean } }) => {
        if (this.photoId !== id) return; // veraltete Antwort ignorieren

        this.photo.set(photo);
        this.imageUrl.set(bildUrl(photo?.Bildpfad));
        this.likes.set(likesRes?.likes ?? 0);
        this.liked.set(likesRes?.liked ?? false);
        this.status.set('loaded');
      },
      error: (err) => {
        console.error('Foto konnte nicht geladen werden', err);
        if (this.photoId === id) {
          this.status.set('error');
        }
      },
    });
  }

  isDeleting = signal(false);

  // Nur true, wenn der eingeloggte Nutzer auch der Besitzer dieses Fotos ist
  get istEigenesFoto(): boolean {
    const p = this.photo();
    const benutzer = this.auth.currentUser();
    return !!p && !!benutzer && p.user_Id === benutzer.user_Id;
  }

  deletePhoto(): void {
    const p = this.photo();
    const benutzer = this.auth.currentUser();
    if (!p || !benutzer) return;

    const bestaetigt = confirm('Dieses Foto wirklich unwiderruflich löschen?');
    if (!bestaetigt) return;

    this.isDeleting.set(true);

    this.api.deletePhoto(p.photo_Id, benutzer.user_Id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.photoDeleted.emit(p.photo_Id);
        this.onClose();
      },
      error: (err) => {
        this.isDeleting.set(false);
        console.error('Foto konnte nicht gelöscht werden', err);
        alert(err.error?.error || 'Foto konnte nicht gelöscht werden.');
      },
    });
  }

  onImageError(): void {
    this.imageFailed.set(true);
  }

  onClose(): void {
    this.status.set('idle');
    this.photo.set(null);
    this.close.emit();
  }

  toggleLike(): void {
    const benutzer = this.auth.currentUser();
    if (!benutzer || !this.photoId) {
      alert('Bitte melde dich an, um Fotos zu liken.');
      return;
    }

    this.api.toggleLike(this.photoId, benutzer.user_Id).subscribe({
      next: (antwort: { liked: boolean; likes: number }) => {
        this.liked.set(antwort.liked);
        this.likes.set(antwort.likes);
      },
      error: (err) => console.error('Like fehlgeschlagen', err),
    });
  }

  private handleWsMessage(msg: WsMessage): void {
    const aktuellesFoto = this.photo();
    if (!aktuellesFoto) return;

    switch (msg.type) {
      case 'like-update':
        // Likes eines ANDEREN Nutzers auf das gerade offene Foto live übernehmen
        if (msg.photo_Id === aktuellesFoto.photo_Id) {
          this.likes.set(msg.likes);
        }
        break;

      case 'photo-deleted':
        // Jemand anders hat das gerade offene Foto gelöscht -> Modal schließen
        if (msg.photo_Id === aktuellesFoto.photo_Id) {
          this.photoDeleted.emit(msg.photo_Id);
          this.onClose();
        }
        break;
    }
  }
}