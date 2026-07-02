import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface PhotoFilter {
  camera: string;
  location: string;
  category: string;
  searchTerm: string;
}

@Component({
  selector: 'app-filter-bar',
  imports: [FormsModule],
  styleUrls: ['./Filterbar.css'],
  template: `
    <div class="filter-bar">
      <div class="filter-item">
        <i class="ti ti-camera"></i>
        <select [(ngModel)]="filter.camera" (ngModelChange)="onFilterChange()">
          <option value="">Kamera</option>
          <option *ngFor="let c of cameras" [value]="c">{{ c }}</option>
        </select>
      </div>

      <div class="filter-item">
        <i class="ti ti-map-pin"></i>
        <select [(ngModel)]="filter.location" (ngModelChange)="onFilterChange()">
          <option value="">Location</option>
          <option *ngFor="let l of locations" [value]="l">{{ l }}</option>
        </select>
      </div>

      <div class="filter-item">
        <i class="ti ti-category"></i>
        <select [(ngModel)]="filter.category" (ngModelChange)="onFilterChange()">
          <option value="">Kategorie</option>
          <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="filter-item search">
        <i class="ti ti-search"></i>
        <input
          type="text"
          placeholder="Suche..."
          [(ngModel)]="filter.searchTerm"
          (ngModelChange)="onFilterChange()"
        />
      </div>

      <button class="reset-btn" (click)="resetFilters()">Zurücksetzen</button>
    </div>
  `,
})
export class FilterBarComponent {
  @Output() filterChange = new EventEmitter<PhotoFilter>();

  cameras: string[] = ['Canon EOS R5', 'Sony A7 IV', 'Nikon Z6', 'Fujifilm X-T5'];
  locations: string[] = ['Bremen', 'Berlin', 'Hamburg', 'München'];
  categories: string[] = ['Natur', 'Architektur', 'People', 'Fashion', 'Kunst'];

  filter: PhotoFilter = {
    camera: '',
    location: '',
    category: '',
    searchTerm: '',
  };

  onFilterChange(): void {
    this.filterChange.emit(this.filter);
  }

  resetFilters(): void {
    this.filter = { camera: '', location: '', category: '', searchTerm: '' };
    this.onFilterChange();
  }
}
