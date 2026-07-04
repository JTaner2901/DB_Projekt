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

  register(daten: { Email: string; Benutzername: string; Passwort: string; Location?: string }): Observable<any> {
    return this.http.post(`${API_URL}/api/auth/register`, daten);
  }

  login(daten: { Email: string; Passwort: string }): Observable<any> {
    return this.http.post(`${API_URL}/api/auth/login`, daten);
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

  // formData muss die Felder user_Id, Titel, Datum, bild (Datei), etc. enthalten
  uploadPhoto(formData: FormData): Observable<any> {
    return this.http.post(`${API_URL}/api/photos`, formData);
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

  getLikes(photoId: number): Observable<any> {
    return this.http.get(`${API_URL}/api/photos/${photoId}/likes`);
  }
}