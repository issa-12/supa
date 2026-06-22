import { ApiProperty } from '@nestjs/swagger';

export const SHELF_STATUSES = ['read', 'want_to_read', 'currently_reading'] as const;
export type ShelfStatus = (typeof SHELF_STATUSES)[number];

export class ShelfBookDto {
  @ApiProperty({ example: 42 })
  bookId!: number;

  @ApiProperty({ example: 'zyTCAlFPjgYC', nullable: true })
  googleBooksId!: string | null;

  @ApiProperty({ example: 'The Hobbit' })
  title!: string;

  @ApiProperty({ example: 'J.R.R. Tolkien' })
  author!: string;

  @ApiProperty({ nullable: true, example: 'https://books.google.com/…' })
  coverUrl!: string | null;
}

export class ShelfItemDto {
  @ApiProperty({ example: 101, description: 'Shelf item id (user_book_id).' })
  id!: number;

  @ApiProperty({ enum: SHELF_STATUSES, example: 'currently_reading' })
  status!: ShelfStatus;

  @ApiProperty({ nullable: true, minimum: 1, maximum: 5, example: 5 })
  rating!: number | null;

  @ApiProperty({ nullable: true, example: 'A timeless adventure.' })
  review!: string | null;

  @ApiProperty({ nullable: true, example: 120 })
  currentPage!: number | null;

  @ApiProperty({ nullable: true, example: 310 })
  totalPages!: number | null;

  @ApiProperty({ example: '2026-06-21T10:00:00.000Z' })
  addedAt!: string;

  @ApiProperty({ nullable: true, example: '2026-06-21T12:00:00.000Z' })
  updatedAt!: string | null;

  @ApiProperty({ type: ShelfBookDto })
  book!: ShelfBookDto;
}

export class CreateShelfItemDto {
  @ApiProperty({ example: 'zyTCAlFPjgYC', description: 'Google Books volume id. The book is added to the shared catalog if not already present.' })
  googleBooksId!: string;

  @ApiProperty({ enum: SHELF_STATUSES, example: 'want_to_read' })
  status!: ShelfStatus;

  @ApiProperty({ required: false, nullable: true, minimum: 1, maximum: 5 })
  rating?: number | null;

  @ApiProperty({ required: false, nullable: true })
  review?: string | null;

  @ApiProperty({ required: false, nullable: true })
  currentPage?: number | null;

  @ApiProperty({ required: false, nullable: true })
  totalPages?: number | null;
}

export class ReplaceShelfItemDto {
  @ApiProperty({ enum: SHELF_STATUSES, description: 'Full replacement of the shelf item. Any optional field omitted is reset to null.' })
  status!: ShelfStatus;

  @ApiProperty({ required: false, nullable: true, minimum: 1, maximum: 5 })
  rating?: number | null;

  @ApiProperty({ required: false, nullable: true })
  review?: string | null;

  @ApiProperty({ required: false, nullable: true })
  currentPage?: number | null;

  @ApiProperty({ required: false, nullable: true })
  totalPages?: number | null;
}

export class UpdateShelfItemDto {
  @ApiProperty({ required: false, enum: SHELF_STATUSES })
  status?: ShelfStatus;

  @ApiProperty({ required: false, nullable: true, minimum: 1, maximum: 5 })
  rating?: number | null;

  @ApiProperty({ required: false, nullable: true })
  review?: string | null;

  @ApiProperty({ required: false, nullable: true })
  currentPage?: number | null;

  @ApiProperty({ required: false, nullable: true })
  totalPages?: number | null;
}
