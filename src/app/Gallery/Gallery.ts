import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryPhoto {
  id: number;
  url: string;
  photographer: string;
  likes: number;
  span: 'normal' | 'tall';
}

@Component({
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './Gallery.html',
  styleUrl: './Gallery.css'
})
export class Gallery {
  photos: GalleryPhoto[] = [
    { id: 1, url: 'https://picsum.photos/seed/gal1/500/340', photographer: 'Nina B.', likes: 128, span: 'normal' },
    { id: 2, url: 'https://picsum.photos/seed/gal2/500/720', photographer: 'David Chen', likes: 842, span: 'tall' },
    { id: 3, url: 'https://picsum.photos/seed/gal3/500/340', photographer: 'Sara L.', likes: 96, span: 'normal' },
    { id: 4, url: 'https://picsum.photos/seed/gal4/500/340', photographer: 'Marco T.', likes: 254, span: 'normal' },
  ];

  loadMore(): void {
    // Platzhalter - später per API weitere Fotos nachladen
    console.log('Load more inspiration...');
  }
}
