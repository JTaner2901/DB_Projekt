import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface PhotoFilter {
  camera: string;
  location: string;
  specs: string;
  searchTerm: string;
}

interface Category {
  name: string;
  image: string;
}

@Component({
  selector: 'app-discover',
  imports: [FormsModule, CommonModule],
  templateUrl: './Discover.html',
  styleUrl: './Discover.css'
})
export class Discover {
  @Output() filterChange = new EventEmitter<PhotoFilter>();

  cameras: string[] = ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z6', 'Fujifilm X-T5'];
  locations: string[] = ['Bremen', 'Berlin', 'Hamburg', 'München'];
  specs: string[] = ['f/1.4 - f/2.8', 'f/4 - f/8', 'ISO 100-400', 'ISO 800+'];

  filter: PhotoFilter = {
    camera: '',
    location: '',
    specs: '',
    searchTerm: '',
  };

  categories: Category[] = [
    { name: 'Nature', image: 'https://picsum.photos/seed/cat-nature/300/220' },
    { name: 'Architecture', image: 'https://picsum.photos/seed/cat-architecture/300/220' },
    { name: 'People', image: 'https://picsum.photos/seed/cat-people/300/220' },
    { name: 'Fashion', image: 'https://picsum.photos/seed/cat-fashion/300/220' },
    { name: 'Art', image: 'https://picsum.photos/seed/cat-art/300/220' },
  ];

  onFilterChange(): void {
    this.filterChange.emit(this.filter);
  }

  resetFilters(): void {
    this.filter = { camera: '', location: '', specs: '', searchTerm: '' };
    this.onFilterChange();
  }

  selectCategory(name: string): void {
    // Platzhalter - später Kategorie direkt als Filter setzen
    console.log('Kategorie gewählt:', name);
  }
}
