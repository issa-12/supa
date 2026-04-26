import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  joinDate: string;
}

interface ReadingStats {
  booksReadThisYear: number;
  booksGoal: number;
  currentReadingStreak: number;
  lastReadDate: string;
}

interface BookCollection {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating?: number;
  category: 'mostLiked' | 'inBetween' | 'leastLiked';
  dateAdded: string;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);

  userProfile: UserProfile = {
    id: '1',
    name: 'Eleanor Vance',
    email: 'eleanor@example.com',
    bio: 'Avid thriller enthusiast and creative writer. Trying to read 50 books this year. Always looking for thoughtful recommendations and insightful written critiques.',
    avatarUrl: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F25-35%2FEuropean%2F2',
    joinDate: '2021',
  };

  readingStats: ReadingStats = {
    booksReadThisYear: 54,
    booksGoal: 50,
    currentReadingStreak: 15,
    lastReadDate: new Date().toISOString(),
  };

  mostLikedBooks: BookCollection[] = [
    {
      id: '1',
      title: 'The Silent Patient',
      author: 'Alex Michaelides',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/64482471-c91c-4668-b6f2-0b0db8a3d125.jpg',
      rating: 5,
      category: 'mostLiked',
      dateAdded: '2024-01-15',
    },
    {
      id: '2',
      title: 'The Maid',
      author: 'Nita Prose',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/08ab14c7-8ba7-43e7-8f04-4b47276a3634.jpg',
      rating: 5,
      category: 'mostLiked',
      dateAdded: '2024-02-20',
    },
    {
      id: '3',
      title: 'Yellowface',
      author: 'R.F. Kuang',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/0c71efb7-0092-41d5-a3f4-e4450155e530.jpg',
      rating: 5,
      category: 'mostLiked',
      dateAdded: '2024-03-10',
    },
    {
      id: '4',
      title: 'Babel',
      author: 'R.F. Kuang',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/48a006e9-223c-495f-8f72-9968d0df8216.jpg',
      rating: 5,
      category: 'mostLiked',
      dateAdded: '2024-03-25',
    },
  ];

  inBetweenBooks: BookCollection[] = [
    {
      id: '5',
      title: 'In Between',
      author: 'Susan Brown',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/5bb029c2-b31f-404d-a821-5f61a648e3b3.jpg',
      rating: 3,
      category: 'inBetween',
      dateAdded: '2024-04-01',
    },
    {
      id: '6',
      title: 'Normal People',
      author: 'Sally Rooney',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/a2727c5f-e372-481d-a0e8-5ba63dfdef0b.jpg',
      rating: 3,
      category: 'inBetween',
      dateAdded: '2024-04-10',
    },
    {
      id: '7',
      title: 'Project Hail Mary',
      author: 'Andy Weir',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/dc1d1c34-e39b-4eb3-80d6-030d12105f2e.jpg',
      rating: 3,
      category: 'inBetween',
      dateAdded: '2024-04-15',
    },
    {
      id: '8',
      title: 'Book Club',
      author: 'Jane Smith',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/47c9689e-8f30-4617-a399-1f1894ec550d.jpg',
      rating: 3,
      category: 'inBetween',
      dateAdded: '2024-04-20',
    },
  ];

  leastLikedBooks: BookCollection[] = [
    {
      id: '9',
      title: 'The Life Cloud',
      author: 'Unknown Author',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/e1d0cd05-522e-450d-b909-783a5d3f02b7.jpg',
      rating: 2,
      category: 'leastLiked',
      dateAdded: '2024-02-01',
    },
    {
      id: '10',
      title: 'Twilight',
      author: 'Stephenie Meyer',
      coverUrl: 'https://storage.googleapis.com/banani-generated-images/generated-images/a00aa3f5-cb71-4e96-ba5a-06a924d125e9.jpg',
      rating: 2,
      category: 'leastLiked',
      dateAdded: '2024-02-15',
    },
  ];

  userTags = ['Mystery & Thriller', 'Literary Fiction', 'Psychological Thrillers', 'Crime Fiction'];

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    // TODO: Load real user profile from API
  }

  onEditProfile(): void {
    console.log('Edit profile');
  }

  onFollowUser(): void {
    console.log('Follow user');
  }

  onViewBook(book: BookCollection): void {
    console.log('View book:', book.title);
  }

  onRateBook(book: BookCollection): void {
    console.log('Rate book:', book.title);
  }
}
