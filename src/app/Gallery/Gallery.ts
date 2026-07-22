import { Component, OnDestroy, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService } from '../services/api.services';
import { WebsocketService, WsMessage } from '../services/websocket.service';
import { bildUrl } from '../shared/bild-url';

interface GalleryPhoto {
  id: number;
  url: string;
  photographer: string;
  likes: number;
  span: 'normal' | 'tall';
}

// Backend liefert photo_Id, Titel, Bildpfad, Benutzername, likes, ...
// (siehe GET /api/photos in server.js)
interface ApiPhoto {
  photo_Id: number;
  Bildpfad: string;
  Benutzername: string;
  likes: number;
}

@Component({
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './Gallery.html',
  styleUrl: './Gallery.css'
})
export class Gallery implements OnDestroy {
  // Home zeigt nur eine Vorschau - die komplette Sammlung gibt's unter /explore
  private readonly PREVIEW_LIMIT = 8;

  photos: GalleryPhoto[] = [];

  private wsSubscription?: Subscription;

  constructor(
    private router: Router,
    private api: ApiService,
    private ws: WebsocketService,
  ) {
    // afterNextRender laeuft NUR im Browser und erst NACHDEM der erste
    // Render-/Hydration-Durchlauf fertig ist. Das verhindert NG0100,
    // das sonst auftritt, wenn getPhotos() so schnell antwortet, dass
    // "photos" sich noch waehrend der Hydration-Pruefung aendert.
    afterNextRender(() => {
      this.loadPhotos();

      this.ws.connect();
      this.wsSubscription = this.ws.messages.subscribe((msg) => this.handleWsMessage(msg));
    });
  }

  ngOnDestroy(): void {
    // Nur die eigene Subscription beenden - der WebSocket selbst bleibt offen,
    // falls andere Komponenten (TopPhotos, PhotoDetail, ...) ihn auch nutzen.
    this.wsSubscription?.unsubscribe();
  }

  loadMore(): void {
    this.router.navigateByUrl('/explore');
  }

  private loadPhotos(): void {
    this.api.getPhotos().subscribe({
      next: (rows: ApiPhoto[]) => {
        // server.js sortiert bereits nach Datum DESC - die ersten N sind die neuesten
        this.photos = rows
          .slice(0, this.PREVIEW_LIMIT)
          .map((foto, index) => this.mapApiPhoto(foto, index));
      },
      error: (err) => console.error('Fotos konnten nicht geladen werden', err),
    });
  }

  private handleWsMessage(msg: WsMessage): void {
    switch (msg.type) {
      case 'new-photo':
        // Neues Foto oben einfügen, Vorschau aber auf PREVIEW_LIMIT begrenzt halten
        this.photos = [this.mapApiPhoto(msg.photo as ApiPhoto, 0), ...this.photos]
          .slice(0, this.PREVIEW_LIMIT);
        break;

      case 'photo-deleted':
        this.photos = this.photos.filter((f) => f.id !== msg.photo_Id);
        break;

      case 'like-update': {
        const foto = this.photos.find((f) => f.id === msg.photo_Id);
        if (foto) {
          foto.likes = msg.likes;
        }
        break;
      }
    }
  }

  private mapApiPhoto(foto: ApiPhoto, index: number): GalleryPhoto {
    return {
      id: foto.photo_Id,
      url: bildUrl(foto.Bildpfad),
      photographer: foto.Benutzername,
      likes: foto.likes,
      // Rein optisches Masonry-Muster - jedes 4. Bild etwas höher.
      span: index % 4 === 1 ? 'tall' : 'normal',
    };
  }
}