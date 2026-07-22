// src/app/shared/services/websocket.service.ts
// ------------------------------------------------------------
// Verbindet sich mit dem Backend-WebSocket (ws.js im Backend) und
// verteilt eingehende Events als Observable an alle Komponenten,
// die sich live aktualisieren sollen (Gallery, PhotoDetail, ...).
// ------------------------------------------------------------

import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Foto {
  photo_Id: number;
  Titel: string;
  Beschreibung: string | null;
  Datum: string;
  Location: string | null;
  Bildpfad: string;
  Benutzername: string;
  likes: number;
}

export interface Kommentar {
  kommentar_Id: number;
  Text: string;
  Datum: string;
  Benutzername: string;
}

export interface WsLikeUpdate {
  type: 'like-update';
  photo_Id: number;
  likes: number;
}

export interface WsNewPhoto {
  type: 'new-photo';
  photo: Foto;
}

export interface WsNewComment {
  type: 'new-comment';
  photo_Id: number;
  comment: Kommentar;
}

export interface WsPhotoDeleted {
  type: 'photo-deleted';
  photo_Id: number;
}

export type WsMessage = WsLikeUpdate | WsNewPhoto | WsNewComment | WsPhotoDeleted;

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  // Passe Host/Port ggf. an eure environment.ts an (z.B. environment.wsUrl)
  private readonly url = `ws://${window.location.hostname}:3000`;

  private socket?: WebSocket;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private manuallyClosed = false;
  private readonly messages$ = new Subject<WsMessage>();

  /** Stream aller eingehenden Backend-Events. In Komponenten abonnieren. */
  get messages(): Observable<WsMessage> {
    return this.messages$.asObservable();
  }

  connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return; // schon verbunden
    }

    this.manuallyClosed = false;
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('WebSocket verbunden:', this.url);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data: WsMessage = JSON.parse(event.data);
        this.messages$.next(data);
      } catch (err) {
        console.error('Ungültige WebSocket-Nachricht:', event.data, err);
      }
    };

    this.socket.onclose = () => {
      if (!this.manuallyClosed) {
        console.warn('WebSocket getrennt - erneuter Versuch in 3s');
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket-Fehler:', err);
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.manuallyClosed = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}