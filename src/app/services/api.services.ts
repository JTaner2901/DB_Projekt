import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Passe das an, falls dein Backend auf einem anderen Port läuft
const API_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // ============ AUTH ============

  // Nur noch Email + Passwort - Benutzername kommt erst im Profil-Setup
  register(daten: { Email: string; Passwort: string }): Observable<any> {
    return this.http.post(`${API_URL}/api/auth/register`, daten);
  }

  login(daten: { Email: string; Passwort: string }): Observable<any> {
    return this.http.post(`${API_URL}/api/auth/login`, daten);
  }

  // Profil vervollständigen (Schritt 2 nach der Registrierung).
  // formData muss die Felder Benutzername, Beschreibung (optional),
  // profilbild (optional, Datei) enthalten.
  completeProfile(userId: number, formData: FormData): Observable<any> {
    return this.http.put(`${API_URL}/api/users/${userId}/profile`, formData);
  }

  // ============ FOTOS ============

  getPhotos(kategorieId?: number): Observable<any> {
    let url = `${API_URL}/api/photos`;
    if (kategorieId) {
      url += `?kategorie=${kategorieId}`;
    }
    return this.http.get(url);
  }

  getPhoto(photoId: number): Observable<any> {
    return this.http.get(`${API_URL}/api/photos/${photoId}`);
  }

  getPhotosByUser(userId: number): Observable<any> {
    return this.http.get(`${API_URL}/api/users/${userId}/photos`);
  }

  // Vollständiges Profil eines Nutzers (Location, Bio, Profilbild, etc.)
  getUser(userId: number): Observable<any> {
    return this.http.get(`${API_URL}/api/users/${userId}`);
  }

  // Likes erhalten (auf eigene Fotos) + Likes gegeben (selbst vergeben)
  getLikesSummary(userId: number): Observable<any> {
    return this.http.get(`${API_URL}/api/users/${userId}/likes-summary`);
  }

  // formData muss die Felder user_Id, Titel, Datum, bild (Datei), etc. enthalten
  uploadPhoto(formData: FormData): Observable<any> {
    return this.http.post(`${API_URL}/api/photos`, formData);
  }

  // Löscht ein Foto - nur möglich, wenn userId auch wirklich der Besitzer ist
  // (wird zusätzlich serverseitig geprüft)
  deletePhoto(photoId: number, userId: number): Observable<any> {
    return this.http.delete(`${API_URL}/api/photos/${photoId}?user_Id=${userId}`);
  }

  // ============ KATEGORIEN ============

  getCategories(): Observable<any> {
    return this.http.get(`${API_URL}/api/categories`);
  }

  // ============ KOMMENTARE ============

  getComments(photoId: number): Observable<any> {
    return this.http.get(`${API_URL}/api/photos/${photoId}/comments`);
  }

  addComment(photoId: number, userId: number, text: string): Observable<any> {
    return this.http.post(`${API_URL}/api/photos/${photoId}/comments`, {
      user_Id: userId,
      Text: text,
    });
  }

  // ============ LIKES ============

  toggleLike(photoId: number, userId: number): Observable<any> {
    return this.http.post(`${API_URL}/api/photos/${photoId}/like`, { user_Id: userId });
  }

  getLikes(photoId: number, userId?: number): Observable<any> {
    let url = `${API_URL}/api/photos/${photoId}/likes`;
    if (userId) {
      url += `?user_Id=${userId}`;
    }
    return this.http.get(url);
  }
}