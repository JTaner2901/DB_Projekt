import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.services';
import { WebsocketService, WsMessage } from '../services/websocket.service';
import { PhotoDetail } from '../PhotoDetail/PhotoDetail';
import { bildUrl } from '../shared/bild-url';

const API_BASE = 'http://localhost:3000';

interface TopPhoto {
  id: number | null; // null = Easter Egg, kein echtes DB-Foto
  url: string;
  photographer: string;
  likes: number;
}

@Component({
  selector: 'app-top-photos',
  imports: [CommonModule, PhotoDetail],
  templateUrl: './TopPhotos.html',
  styleUrl: './TopPhotos.css'
})
export class TopPhotos implements OnInit, OnDestroy {
  photos = signal<TopPhoto[]>([]);
  centerIndex = 2;
  selectedPhotoId: number | null = null;

  private wsSubscription?: Subscription;

  constructor(
    private api: ApiService,
    private ws: WebsocketService,
  ) {}

  ngOnInit(): void {
    // Alle Fotos holen (liefert schon die Like-Anzahl pro Foto mit),
    // client-seitig nach Likes sortieren und die Top 5 nehmen
    this.api.getPhotos().subscribe({
      next: (daten: any[]) => {
        const topFotos: TopPhoto[] = [...daten]
          .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
          .slice(0, 5)
          .map((p) => ({
            id: p.photo_Id,
            url: bildUrl(p.Bildpfad) || 'https://picsum.photos/500/650',
            photographer: p.Benutzername,
            likes: p.likes ?? 0,
          }));

        // Easter Egg bleibt fest mit drin, ist kein echtes Foto aus der DB
        topFotos.push({
          id: null,
          url: '/easteregg/Fyni.JPEG',
          photographer: 'Fyni',
          likes: 0,
        });

        this.photos.set(topFotos);
      },
      error: (err) => console.error('Top-Fotos konnten nicht geladen werden', err),
    });

    // Live-Updates: Likes eines sichtbaren Fotos aktualisieren, geloeschte Fotos rausnehmen.
    // (Neu-Sortierung bei Like-Aenderungen bewusst weggelassen, damit die Karten
    // nicht ploetzlich waehrend des Anschauens durcheinanderspringen.)
    this.ws.connect();
    this.wsSubscription = this.ws.messages.subscribe((msg) => this.handleWsMessage(msg));
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
  }

  private handleWsMessage(msg: WsMessage): void {
    switch (msg.type) {
      case 'like-update':
        this.photos.update((liste) =>
          liste.map((p) => (p.id === msg.photo_Id ? { ...p, likes: msg.likes } : p))
        );
        break;

      case 'photo-deleted':
        this.onPhotoDeleted(msg.photo_Id);
        break;
    }
  }

  prev(): void {
    this.centerIndex = Math.max(0, this.centerIndex - 1);
  }

  next(): void {
    this.centerIndex = Math.min(this.photos().length - 1, this.centerIndex + 1);
  }

  goTo(index: number): void {
    this.centerIndex = index;
  }

  // Öffnet das PhotoDetail-Modal - nur für echte Fotos (das Easter Egg hat
  // keine echte photo_Id und lässt sich deshalb nicht öffnen)
  openPhoto(photo: TopPhoto): void {
    if (photo.id) {
      this.selectedPhotoId = photo.id;
    }
  }

  closePhoto(): void {
    this.selectedPhotoId = null;
  }

  onPhotoDeleted(photoId: number): void {
    this.photos.update((liste) => liste.filter((p) => p.id !== photoId));
  }

  getCardStyle(index: number): Record<string, string> {
    const offset = index - this.centerIndex;
    const abs = Math.abs(offset);

    const translateX = offset * 210;
    const translateY = abs * 46;
    const rotate = offset * 9;
    const scale = Math.max(0.62, 1 - abs * 0.16);
    const opacity = abs > 3 ? 0 : Math.max(0.25, 1 - abs * 0.28);
    const zIndex = 100 - abs;

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
      opacity: `${opacity}`,
      zIndex: `${zIndex}`,
    };
  }
}