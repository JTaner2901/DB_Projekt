import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GearItem {
  icon: string;
  name: string;
  subtitle: string;
}

interface GalleryItem {
  url: string;
  caption?: string;
  date?: string;
  tall?: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './Profile.html',
  styleUrl: './Profile.css'
})
export class Profile {
  // Platzhalter - später aus der DB laden, sobald Profile-API steht
  coverPhoto = 'https://picsum.photos/seed/profile-cover/1200/500';
  avatar = 'https://picsum.photos/seed/profile-avatar/200/200';

  name = 'Julian Thorne';
  title = 'Landscape & Travel Photographer';
  location = 'Reykjavík, Iceland';

  stats = {
    views: '1.2M',
    followers: '42.8K',
    following: '842',
    photosShared: '156',
  };

  biography = 'Specializing in high-altitude landscapes and the ethereal quality of Arctic light. My work explores the intersection of vast scale and intimate detail in the natural world. Based in Iceland, traveling globally.';

  gearBag: GearItem[] = [
    { icon: 'ti-camera', name: 'Sony A7R IV', subtitle: 'Primary Body' },
    { icon: 'ti-aperture', name: '35mm f/1.4 GM', subtitle: 'Wide Landscapes' },
    { icon: 'ti-aperture', name: '70-200mm f/2.8 OSS II', subtitle: 'Compressed Landscapes' },
    { icon: 'ti-filter', name: 'PolarPro QuartzLine', subtitle: 'ND & PL Filters' },
  ];

  tabs = ['Gallery', 'Collections', 'About', 'Appreciations'];
  activeTab = 'Gallery';

  featured: GalleryItem = {
    url: 'https://picsum.photos/seed/profile-featured/500/700',
    caption: 'Winter Solitude',
    date: 'June 21st',
    tall: true,
  };

  galleryPhotos: GalleryItem[] = [
    { url: 'https://picsum.photos/seed/profile-g1/400/260' },
    { url: 'https://picsum.photos/seed/profile-g2/400/260' },
    { url: 'https://picsum.photos/seed/profile-g3/400/260' },
    { url: 'https://picsum.photos/seed/profile-g4/400/260' },
    { url: 'https://picsum.photos/seed/profile-g5/400/260' },
  ];

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  loadMore(): void {
    // Platzhalter - später Pagination per API
    console.log('Weitere Fotos laden...');
  }
}
