import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.services';
import { Auth } from '../auth/Auth';
import { PhotoDetail } from '../PhotoDetail/PhotoDetail';
import { bildUrl } from '../shared/bild-url';

const API_BASE = 'http://localhost:3000';

interface EigenesFoto {
  photo_Id: number;
  Titel: string;
  url: string;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, PhotoDetail],
  templateUrl: './Profile.html',
  styleUrl: './Profile.css'
})
export class Profile implements OnInit {
  benutzername = signal('');
  beschreibung = signal<string | null>(null);
  location = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);
  mitgliedSeit = signal<string | null>(null);

  photos = signal<EigenesFoto[]>([]);
  isLoading = signal(true);

  likesErhalten = signal(0);
  likesGegeben = signal(0);

  tabs = ['Gallery', 'Collections', 'About', 'Appreciations'];
  activeTab = 'Gallery';

  selectedPhotoId: number | null = null;

  constructor(private api: ApiService, private auth: Auth) {}

  ngOnInit(): void {
    const benutzer = this.auth.currentUser();
    if (!benutzer) return;

    // Vollständiges Profil aus der DB laden - Location/Bio/Profilbild/
    // Registrierungsdatum stehen nicht alle in der Login-Session
    this.api.getUser(benutzer.user_Id).subscribe({
      next: (daten) => {
        this.benutzername.set(daten.Benutzername);
        this.beschreibung.set(daten.Beschreibung);
        this.location.set(daten.Location);
        this.mitgliedSeit.set(daten.Registrierungsdatum);
        this.avatarUrl.set(bildUrl(daten.Profilbildpfad));
      },
      error: (err) => console.error('Profil konnte nicht geladen werden', err),
    });

    this.api.getPhotosByUser(benutzer.user_Id).subscribe({
      next: (daten: any[]) => {
        this.photos.set(
          daten.map((p) => ({
            photo_Id: p.photo_Id,
            Titel: p.Titel,
            url: bildUrl(p.Bildpfad),
          }))
        );
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Fotos konnten nicht geladen werden', err);
        this.isLoading.set(false);
      },
    });

    this.api.getLikesSummary(benutzer.user_Id).subscribe({
      next: (daten: { erhalten: number; gegeben: number }) => {
        this.likesErhalten.set(daten.erhalten);
        this.likesGegeben.set(daten.gegeben);
      },
      error: (err) => console.error('Likes-Übersicht konnte nicht geladen werden', err),
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  openPhoto(photoId: number): void {
    this.selectedPhotoId = photoId;
  }

  closePhoto(): void {
    this.selectedPhotoId = null;
  }

  onPhotoDeleted(photoId: number): void {
    this.photos.update((liste) => liste.filter((p) => p.photo_Id !== photoId));
  }
}