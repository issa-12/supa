import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { SupabaseService } from '../supabase/supabase.service';

export interface RecommendationBook {
  dbBookId: number | null;
  googleBooksId: string | null;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  reason: string;
  genre: string | null;
}

interface ClaudeSuggestion {
  title: string;
  author: string;
  description: string;
  reason: string;
  genre: string;
}

@Injectable()
export class RecommendationsService {
  private readonly anthropic = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });
  private readonly googleBooksKey = process.env['GOOGLE_BOOKS_API_KEY'];

  constructor(private readonly supabase: SupabaseService) {}

  async verifyUser(token: string): Promise<string> {
    const { data, error } = await this.supabase.getAdmin().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid or expired session.');
    return data.user.id;
  }

  async getRecommendations(userId: string): Promise<RecommendationBook[]> {
    const cached = await this.getCached(userId);
    if (cached) return cached;

    const [genres, ratedBooks, readBooks] = await Promise.all([
      this.getUserGenres(userId),
      this.getUserRatedBooks(userId),
      this.getReadBooks(userId),
    ]);

    let suggestions: ClaudeSuggestion[];
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      console.warn('[Recommendations] ANTHROPIC_API_KEY not set — using mock suggestions for testing.');
      suggestions = this.mockSuggestions();
    } else {
      try {
        suggestions = await this.callClaude(genres, ratedBooks, readBooks);
      } catch (err) {
        console.error('[Recommendations] Claude API call failed:', (err as Error).message);
        console.warn('[Recommendations] Falling back to mock suggestions.');
        suggestions = this.mockSuggestions();
      }
    }

    const enriched = await Promise.all(
      suggestions.map((s) =>
        this.enrichWithGoogleBooks(s).catch((err) => {
          console.warn(`[Recommendations] Google Books enrichment failed for "${s.title}":`, (err as Error).message);
          return {
            dbBookId: null,
            googleBooksId: null,
            title: s.title,
            author: s.author,
            description: s.description,
            coverUrl: null,
            reason: s.reason,
            genre: s.genre,
          };
        }),
      ),
    );

    await this.cacheRecommendations(userId, enriched);
    return enriched;
  }

  private async getCached(userId: string): Promise<RecommendationBook[] | null> {
    const { data } = await this.supabase
      .getAdmin()
      .from('ai_recommendations')
      .select('recommendations, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return null;
    if (new Date(data['expires_at'] as string) <= new Date()) return null;
    return data['recommendations'] as RecommendationBook[];
  }

  private async getUserGenres(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .getAdmin()
      .from('user_genres')
      .select('genres(genre_name)')
      .eq('user_id', userId);

    return (data ?? [])
      .map((row) => {
        const g = row['genres'] as unknown as { genre_name: string } | null;
        return g?.genre_name ?? null;
      })
      .filter((name): name is string => name !== null);
  }

  private async getUserRatedBooks(
    userId: string,
  ): Promise<Array<{ title: string; rating: number }>> {
    const { data } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select('rating, books(title)')
      .eq('user_id', userId)
      .not('rating', 'is', null)
      .order('rating', { ascending: false })
      .limit(20);

    return (data ?? []).map((row) => {
      const book = row['books'] as unknown as { title: string } | null;
      return { title: book?.title ?? 'Unknown', rating: row['rating'] as number };
    });
  }

  private async getReadBooks(userId: string): Promise<string[]> {
    const { data: statusRow } = await this.supabase
      .getAdmin()
      .from('reading_statuses')
      .select('status_id')
      .eq('status_name', 'read')
      .single();

    const statusId = statusRow?.['status_id'];
    if (!statusId) return [];

    const { data } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select('books(title)')
      .eq('user_id', userId)
      .eq('status_id', statusId)
      .order('updated_at', { ascending: false })
      .limit(20);

    return (data ?? [])
      .map((row) => {
        const book = row['books'] as unknown as { title: string } | null;
        return book?.title ?? null;
      })
      .filter((t): t is string => t !== null);
  }

  private mockSuggestions(): ClaudeSuggestion[] {
    return [
      { title: 'The Name of the Wind', author: 'Patrick Rothfuss', description: 'A heroic fantasy told in first-person by Kvothe, a legendary wizard and musician recounting his life story.', reason: 'A beautifully written epic fantasy with deep world-building and a compelling narrator.', genre: 'Fantasy' },
      { title: 'Project Hail Mary', author: 'Andy Weir', description: 'A lone astronaut wakes up with no memory on a desperate mission to save Earth from an extinction-level threat.', reason: 'A fast-paced science-driven thriller packed with wit and clever problem-solving.', genre: 'Science Fiction' },
      { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', description: 'An ordinary man is swept into a mad journey through space after Earth is demolished to make way for a bypass.', reason: 'A brilliantly funny sci-fi classic beloved by fans of clever, absurdist humor.', genre: 'Science Fiction' },
      { title: 'Dune', author: 'Frank Herbert', description: 'A sweeping sci-fi epic set on a desert planet where politics, religion, and ecology collide in a battle for power.', reason: 'A foundational sci-fi masterpiece with rich lore and political depth.', genre: 'Science Fiction' },
      { title: 'The Alchemist', author: 'Paulo Coelho', description: 'A young shepherd travels from Spain to Egypt following his dreams, learning lessons about destiny and fulfillment along the way.', reason: 'An inspiring philosophical fable about following your Personal Legend.', genre: 'Fiction' },
      { title: 'Atomic Habits', author: 'James Clear', description: 'A practical guide to building good habits and breaking bad ones using small, incremental changes that compound over time.', reason: 'Actionable, evidence-backed strategies that work for any lifestyle or goal.', genre: 'Self-Help' },
    ];
  }

  private async callClaude(
    genres: string[],
    ratedBooks: Array<{ title: string; rating: number }>,
    readBooks: string[],
  ): Promise<ClaudeSuggestion[]> {
    const genreList = genres.length ? genres.join(', ') : 'general fiction';
    const highlyRated = ratedBooks
      .filter((b) => b.rating >= 4)
      .map((b) => `"${b.title}" (${b.rating}★)`)
      .join(', ') || 'none yet';
    const readList =
      readBooks.length
        ? readBooks
            .slice(0, 10)
            .map((t) => `"${t}"`)
            .join(', ')
        : 'none';
    const excludeTitles = [...ratedBooks.map((b) => b.title), ...readBooks]
      .slice(0, 20)
      .map((t) => `"${t}"`)
      .join(', ');

    const systemPrompt = `You are an expert book recommendation engine. Given a user's reading preferences, recommend books they would genuinely enjoy.

Return ONLY a valid JSON array with no markdown, no code fences, and no extra text. Each item must have exactly these five fields:
{
  "title": "exact book title",
  "author": "full author name",
  "description": "2-3 sentence synopsis of the book",
  "reason": "1 sentence explaining why this specific user would enjoy it",
  "genre": "the single primary genre as 1-2 words, e.g. Fantasy, Mystery, Science Fiction, Romance, Thriller, Historical Fiction, Non-Fiction"
}

Rules:
- Recommend exactly 6 real, well-known books
- Vary recommendations across subgenres within the user's preferred genres
- Do not recommend books in the exclusion list
- Prioritize books matching the user's highest-rated genres`;

    const userMessage = `Favorite genres: ${genreList}
Highly rated books (4-5★): ${highlyRated}
Recently read: ${readList}
Do NOT recommend: ${excludeTitles || 'none'}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as ClaudeSuggestion[];
  }

  private async enrichWithGoogleBooks(suggestion: ClaudeSuggestion): Promise<RecommendationBook> {
    const params = new URLSearchParams({
      q: `${suggestion.title} ${suggestion.author}`,
      maxResults: '1',
      printType: 'books',
    });
    if (this.googleBooksKey) params.set('key', this.googleBooksKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
      res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      return {
        dbBookId: null,
        googleBooksId: null,
        title: suggestion.title,
        author: suggestion.author,
        description: suggestion.description,
        coverUrl: null,
        reason: suggestion.reason,
        genre: suggestion.genre,
      };
    }

    const data = (await res.json()) as {
      items?: Array<{ id: string; volumeInfo: { imageLinks?: { thumbnail?: string } } }>;
    };
    const item = data.items?.[0];

    if (!item) {
      return {
        dbBookId: null,
        googleBooksId: null,
        title: suggestion.title,
        author: suggestion.author,
        description: suggestion.description,
        coverUrl: null,
        reason: suggestion.reason,
        genre: suggestion.genre,
      };
    }

    const googleBooksId = item.id;
    const coverUrl =
      item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null;

    // Upsert into public.books so the "Add to shelf" button works with a real DB ID
    const admin = this.supabase.getAdmin();
    const { data: existing } = await admin
      .from('books')
      .select('book_id')
      .eq('google_books_id', googleBooksId)
      .maybeSingle();

    let dbBookId: number | null = null;
    if (existing) {
      dbBookId = existing['book_id'] as number;
    } else {
      const { data: inserted, error } = await admin
        .from('books')
        .insert({
          title: suggestion.title,
          author_name: suggestion.author,
          description: suggestion.description,
          cover_image_url: coverUrl,
          google_books_id: googleBooksId,
        })
        .select('book_id')
        .single();

      if (!error && inserted) {
        dbBookId = inserted['book_id'] as number;
      }
    }

    return {
      dbBookId,
      googleBooksId,
      title: suggestion.title,
      author: suggestion.author,
      description: suggestion.description,
      coverUrl,
      reason: suggestion.reason,
      genre: suggestion.genre,
    };
  }

  private async cacheRecommendations(
    userId: string,
    books: RecommendationBook[],
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await this.supabase
      .getAdmin()
      .from('ai_recommendations')
      .upsert(
        { user_id: userId, recommendations: books, expires_at: expiresAt },
        { onConflict: 'user_id' },
      );
  }
}
