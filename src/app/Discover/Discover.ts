import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.services';

// category ist jetzt die KategorieID (Zahl) als String im Filter-Objekt,
// oder '' wenn keine Kategorie gewählt ist. So passt es exakt zu dem,
// was das Backend bei ?kategorie=<ID> erwartet.
export interface PhotoFilter {
  camera: string;
  location: string;
  specs: string;
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

  // Kamera/Location/Specs bleiben vorerst als feste Auswahl, weil das
  // Backend diese Werte noch nicht mitliefert (siehe Erklärung im Chat)
  cameras: string[] = ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z6', 'Fujifilm X-T5'];
  locations: string[] = ['Bremen', 'Berlin', 'Hamburg', 'München'];
  specs: string[] = ['f/1.4 - f/2.8', 'f/4 - f/8', 'ISO 100-400', 'ISO 800+'];

  filter: PhotoFilter = {
    camera: '',
    location: '',
    specs: '',
    category: '',
    searchTerm: '',
  };

  // Echte Kategorien aus der Datenbank - als Signal, damit Angular
  // Änderungen zuverlässig erkennt (behebt NG0100 ExpressionChangedAfterItHasBeenChecked,
  // das auftrat, wenn die Antwort sehr schnell/synchron aus dem Cache kam)
  categories = signal<Kategorie[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (daten) => this.categories.set(daten),
      error: (err) => console.error('Kategorien konnten nicht geladen werden', err),
    });
  }

  onFilterChange(): void {
    this.filterChange.emit(this.filter);
  }

  resetFilters(): void {
    this.filter = { camera: '', location: '', specs: '', category: '', searchTerm: '' };
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