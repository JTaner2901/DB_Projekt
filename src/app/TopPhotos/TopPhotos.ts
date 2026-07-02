import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TopPhoto {
  id: number;
  url: string;
  photographer: string;
  likes: number;
}

@Component({
  selector: 'app-top-photos',
  imports: [CommonModule],
  templateUrl: './TopPhotos.html',
  styleUrl: './TopPhotos.css'
})
export class TopPhotos {
  photos: TopPhoto[] = [
    { id: 1, url: 'https://picsum.photos/seed/capture1/500/650', photographer: 'Lena K.', likes: 342 },
    { id: 2, url: 'https://picsum.photos/seed/capture2/500/650', photographer: 'Tom R.', likes: 218 },
    { id: 3, url: 'https://picsum.photos/seed/capture3/500/650', photographer: 'Mira S.', likes: 501 },
    { id: 4, url: 'https://picsum.photos/seed/capture4/500/650', photographer: 'Jonas W.', likes: 176 },
    { id: 5, url: 'https://picsum.photos/seed/capture5/500/650', photographer: 'Ayla D.', likes: 389 },
    { id: 6, url: '/easteregg/Fyni.JPEG', photographer: 'Fyn P.', likes: 264 },
  ];

  centerIndex = 2;

  prev(): void {
    this.centerIndex = Math.max(0, this.centerIndex - 1);
  }

  next(): void {
    this.centerIndex = Math.min(this.photos.length - 1, this.centerIndex + 1);
  }

  goTo(index: number): void {
    this.centerIndex = index;
  }

  getCardStyle(index: number): Record<string, string> {
    const offset = index - this.centerIndex;
    const abs = Math.abs(offset);

    const translateX = offset * 210;
    const translateY = abs * 46;
    const rotate = offset * 9;
    const scale = Math.max(0.62, 1 - abs * 0.16);
    const opacity = abs > 3 ? 0 : Math.max(0.25, 1 - abs * 0.28);
    const zIndex = 100 - abs;

    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
      opacity: `${opacity}`,
      zIndex: `${zIndex}`,
    };
  }
}