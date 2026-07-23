import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.services';
import { LAENDER } from '../shared/laender';

// category ist die KategorieID (Zahl) als String im Filter-Objekt, oder ''
// wenn keine Kategorie gewählt ist - passt zu ?kategorie=<ID> im Backend.
// location ist ein LAND. camera ist jetzt ein HERSTELLER (z.B. "Apple",
// "Samsung"), nicht mehr ein exaktes Modell - siehe Chat-Erklärung.
// specs/Lens wurde komplett entfernt: die Werte sind zu lang und
// uneinheitlich für ein Dropdown, läuft jetzt über die normale Suche.
export interface PhotoFilter {
  camera: string;
  location: string;
  category: string;
  searchTerm: string;
}

// Eine Kategorie, wie sie wirklich aus der Datenbank kommt (GET /api/categories)
interface Kategorie {
  KategorieID: number;
  Name: string;
}

@Component({
  selector: 'app-discover',
  imports: [FormsModule, CommonModule],
  templateUrl: './Discover.html',
  styleUrl: './Discover.css'
})
export class Discover implements OnInit {
  @Output() filterChange = new EventEmitter<PhotoFilter>();

  // Kamera-Hersteller kommen jetzt live aus der DB (nur Marken, die auch
  // wirklich Fotos haben) statt einer hartcodierten Modell-Liste
  cameras = signal<string[]>([]);

  // Länder statt fester Städte - passend zu Stadt+Land beim Upload
  laender = LAENDER;

  filter: PhotoFilter = {
    camera: '',
    location: '',
    category: '',
    searchTerm: '',
  };

  // Echte Kategorien aus der Datenbank - als Signal, damit Angular
  // Änderungen zuverlässig erkennt
  categories = signal<Kategorie[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (daten) => this.categories.set(daten),
      error: (err) => console.error('Kategorien konnten nicht geladen werden', err),
    });

    this.api.getCameraBrands().subscribe({
      next: (daten) => this.cameras.set(daten),
      error: (err) => console.error('Kamera-Hersteller konnten nicht geladen werden', err),
    });
  }

  onFilterChange(): void {
    this.filterChange.emit(this.filter);
  }

  resetFilters(): void {
    this.filter = { camera: '', location: '', category: '', searchTerm: '' };
    this.onFilterChange();
  }

  // Nimmt jetzt die KategorieID entgegen statt eines Namens
  selectCategory(kategorieId: number): void {
    const idAlsText = String(kategorieId);
    this.filter.category = this.filter.category === idAlsText ? '' : idAlsText;
    this.onFilterChange();
  }

  // Hilfsfunktion fürs Template: zeigt an, ob eine Kategorie-Kachel aktiv ist
  istAktiv(kategorieId: number): boolean {
    return this.filter.category === String(kategorieId);
  }

  // Eigene, lokal gehostete Bilder pro Kategorie (public/kategorien/)
  private readonly categoryImages: Record<string, string> = {
    'Architektur': '/kategorien/architektur.jpg',
    'Autos': '/kategorien/autos.jpg',
    'Essen': '/kategorien/essen.jpg',
    'Fashion': '/kategorien/fashion.jpg',
    'Gegenstände': '/kategorien/gegenstaende.jpg',
    'Kunst': '/kategorien/kunst.jpg',
    'Natur': '/kategorien/natur.jpg',
    'People': '/kategorien/people.jpg',
    'Tiere': '/kategorien/tiere.jpg',
  };

  getCategoryImage(cat: Kategorie): string {
    return this.categoryImages[cat.Name] ?? '/kategorien/default.jpg';
  }
}