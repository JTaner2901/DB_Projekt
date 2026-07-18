import { Component, OnInit, afterNextRender, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Discover, PhotoFilter } from '../Discover/Discover';
import { ApiService } from '../services/api.services';
import { Auth } from '../auth/Auth';
import { PhotoDetail } from '../PhotoDetail/PhotoDetail';

// So sieht ein Foto aus, wie es das Backend jetzt liefert
// (nach der Erweiterung von GET /api/photos um likes + kategorien)
interface ExplorePhoto {
  id: number;
  url: string;
  photographer: string;
  likes: number;
  liked: boolean;      // hat der EINGELOGGTE Nutzer dieses Foto geliked?
  location: string;
  kategorienText: string; // z.B. "Natur, Kunst" - nur zur Anzeige
  tall?: boolean;
}

const API_BASE = 'http://localhost:3000';

@Component({
  selector: 'app-explore',
  imports: [CommonModule, FormsModule, Discover, PhotoDetail],
  templateUrl: './Explore.html',
  styleUrl: './Explore.css'
})
export class Explore implements OnInit {
  filter: PhotoFilter = {
    camera: '',
    location: '',
    specs: '',
    category: '',
    searchTerm: '',
  };

  sortOption: 'newest' | 'popular' = 'newest';
  viewMode: 'grid' | 'masonry' = 'masonry';

  currentPage = 1;
  pageSize = 12;

  allPhotos = signal<ExplorePhoto[]>([]);
  isLoading = false;
  private vorherigeKategorie = ''; // merkt sich den letzten Filterwert unabhängig vom Objekt

  // Für das Foto-Detail-Modal
  selectedPhotoId: number | null = null;

  constructor(private api: ApiService, private auth: Auth) {
    // Läuft garantiert erst NACH der Hydration im Browser - verhindert,
    // dass der erste Foto-Request durch SSR/Hydration "verschluckt" wird
    // und die Seite beim ersten Aufruf leer bleibt, bis man mit dem
    // Filter interagiert.
    afterNextRender(() => {
      this.ladeFotos();
    });
  }

  ngOnInit(): void {
    // Absichtlich leer gelassen - das Laden passiert jetzt in afterNextRender()
    // im Konstruktor, siehe Kommentar dort.
  }

  // Lädt Fotos vom Backend. Wenn eine Kategorie ausgewählt ist, filtert
  // bereits das Backend danach (?kategorie=<ID>) - effizienter, als
  // erst alles zu laden und dann im Frontend wegzuwerfen.
  private ladeFotos(): void {
    this.isLoading = true;
    const kategorieId = this.filter.category ? Number(this.filter.category) : undefined;

    this.api.getPhotos(kategorieId).subscribe({
      next: (daten: any[]) => {
        this.allPhotos.set(
          daten.map((p) => ({
            id: p.photo_Id,
            url: p.Bildpfad ? `${API_BASE}/${p.Bildpfad}` : 'https://picsum.photos/500/380',
            photographer: p.Benutzername,
            likes: p.likes ?? 0,
            liked: false, // wird erst beim Klick bekannt, siehe toggleLike()
            location: p.Location || '',
            kategorienText: p.kategorien || '',
            tall: false,
          }))
        );
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Fotos konnten nicht geladen werden', err);
        this.isLoading = false;
      },
    });
  }

  // Kamera und Specs sind aktuell client-seitige Platzhalter-Filter:
  // das Backend liefert diese Felder noch nicht pro Foto mit,
  // deshalb greifen diese zwei Filter momentan nicht.
  get filteredPhotos(): ExplorePhoto[] {
    return this.allPhotos().filter((photo) => {
      if (this.filter.location && photo.location !== this.filter.location) return false;
      if (
        this.filter.searchTerm &&
        !photo.photographer.toLowerCase().includes(this.filter.searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }

  get sortedPhotos(): ExplorePhoto[] {
    const photos = [...this.filteredPhotos];
    if (this.sortOption === 'popular') {
      return photos.sort((a, b) => b.likes - a.likes);
    }
    return photos; // "newest" kommt schon sortiert vom Backend (ORDER BY Datum DESC)
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.sortedPhotos.length / this.pageSize));
  }

  get pagedPhotos(): ExplorePhoto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedPhotos.slice(start, start + this.pageSize);
  }

  get activeFilterChips(): { key: keyof PhotoFilter; label: string }[] {
    const chips: { key: keyof PhotoFilter; label: string }[] = [];
    if (this.filter.camera) chips.push({ key: 'camera', label: this.filter.camera });
    if (this.filter.location) chips.push({ key: 'location', label: this.filter.location });
    if (this.filter.specs) chips.push({ key: 'specs', label: this.filter.specs });
    if (this.filter.category) chips.push({ key: 'category', label: 'Kategorie gewählt' });
    if (this.filter.searchTerm) chips.push({ key: 'searchTerm', label: '"' + this.filter.searchTerm + '"' });
    return chips;
  }

  onFilterChange(filter: PhotoFilter): void {
    const kategorieHatSichGeaendert = filter.category !== this.vorherigeKategorie;
    this.filter = { ...filter }; // WICHTIG: Kopie, nicht dieselbe Referenz wie in Discover
    this.vorherigeKategorie = filter.category;
    this.currentPage = 1;

    // Nur bei Kategorie-Änderung neu vom Backend laden, sonst reicht
    // die client-seitige Filterung oben (spart unnötige Anfragen)
    if (kategorieHatSichGeaendert) {
      this.ladeFotos();
    }
  }

  removeChip(key: keyof PhotoFilter): void {
    const neuerFilter = { ...this.filter, [key]: '' };
    this.onFilterChange(neuerFilter);
  }

  clearAllFilters(): void {
    this.onFilterChange({ camera: '', location: '', specs: '', category: '', searchTerm: '' });
  }

  setSort(option: 'newest' | 'popular'): void {
    this.sortOption = option;
    this.currentPage = 1;
  }

  setView(mode: 'grid' | 'masonry'): void {
    this.viewMode = mode;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Liken/Entliken. Aktualisiert die Zahl sofort mit der Antwort vom Backend.
  toggleLike(photo: ExplorePhoto): void {
    const benutzer = this.auth.currentUser();
    if (!benutzer) {
      alert('Bitte melde dich an, um Fotos zu liken.');
      return;
    }

    this.api.toggleLike(photo.id, benutzer.user_Id).subscribe({
      next: (antwort: { liked: boolean; likes: number }) => {
        photo.liked = antwort.liked;
        photo.likes = antwort.likes;
      },
      error: (err) => console.error('Like fehlgeschlagen', err),
    });
  }

  // Öffnet das Foto-Detail-Modal
  openPhoto(photoId: number): void {
    this.selectedPhotoId = photoId;
  }

  closePhoto(): void {
    this.selectedPhotoId = null;
  }
}