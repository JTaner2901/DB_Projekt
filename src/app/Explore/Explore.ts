import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Discover, PhotoFilter } from '../Discover/Discover';

interface ExplorePhoto {
  id: number;
  url: string;
  photographer: string;
  likes: number;
  camera: string;
  location: string;
  category: string;
  daysAgo: number;
  tall?: boolean;
}

@Component({
  selector: 'app-explore',
  imports: [CommonModule, FormsModule, Discover],
  templateUrl: './Explore.html',
  styleUrl: './Explore.css'
})
export class Explore {
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

  // Platzhalter-Datensatz - später durch echte Fotos aus der DB ersetzen
  allPhotos: ExplorePhoto[] = this.generatePhotos();

  private generatePhotos(): ExplorePhoto[] {
    const cameras = ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z6', 'Fujifilm X-T5'];
    const locations = ['Bremen', 'Berlin', 'Hamburg', 'München'];
    const categories = ['Nature', 'Architecture', 'People', 'Fashion', 'Art'];
    const names = ['Lena K.', 'Tom R.', 'Mira S.', 'Jonas W.', 'Ayla D.', 'Felix M.'];

    return Array.from({ length: 42 }, (_, i) => ({
      id: i + 1,
      url: `https://picsum.photos/seed/explore-${i}/500/${i % 3 === 0 ? 650 : 380}`,
      photographer: names[i % names.length],
      likes: Math.floor(Math.random() * 900) + 20,
      camera: cameras[i % cameras.length],
      location: locations[i % locations.length],
      category: categories[i % categories.length],
      daysAgo: Math.floor(Math.random() * 60),
      tall: i % 3 === 0,
    }));
  }

  get filteredPhotos(): ExplorePhoto[] {
    return this.allPhotos.filter(photo => {
      if (this.filter.camera && photo.camera !== this.filter.camera) return false;
      if (this.filter.location && photo.location !== this.filter.location) return false;
      if (this.filter.category && photo.category !== this.filter.category) return false;
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
    return photos.sort((a, b) => a.daysAgo - b.daysAgo);
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
    if (this.filter.category) chips.push({ key: 'category', label: this.filter.category });
    if (this.filter.searchTerm) chips.push({ key: 'searchTerm', label: '"' + this.filter.searchTerm + '"' });
    return chips;
  }

  onFilterChange(filter: PhotoFilter): void {
    this.filter = filter;
    this.currentPage = 1;
  }

  removeChip(key: keyof PhotoFilter): void {
    this.filter = { ...this.filter, [key]: '' };
    this.currentPage = 1;
  }

  clearAllFilters(): void {
    this.filter = { camera: '', location: '', specs: '', category: '', searchTerm: '' };
    this.currentPage = 1;
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
}
