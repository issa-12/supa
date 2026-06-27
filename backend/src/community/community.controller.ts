import { Controller, Get, Post, Body, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { CommunityService } from './community.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private async getUserId(req: Request): Promise<string | null> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    // Enforces a verified email — a raw (unverified) Supabase JWT is rejected.
    return this.supabaseService.getVerifiedUserId(token);
  }

  @Get('posts')
  async getPosts(
    @Query('tag') tag: string,
    @Query('page') page: string,
    @Query('trending') trending: string,
    @Query('scope') scope: string,
    @Query('bookId') bookId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = await this.getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const parsedPage = Number.parseInt(page ?? '0', 10);
    const safePage = Number.isFinite(parsedPage) && parsedPage >= 0 ? parsedPage : 0;
    const safeScope = scope === 'friends' || scope === 'mine' ? scope : undefined;
    const safeBookId = bookId ? Number.parseInt(bookId, 10) : undefined;
    const validBookId = safeBookId && Number.isInteger(safeBookId) && safeBookId > 0 ? safeBookId : undefined;

    try {
      const posts =
        trending === 'true'
          ? await this.communityService.getTrendingPosts(userId)
          : await this.communityService.getAllPosts(
              userId,
              tag || undefined,
              safePage,
              20,
              safeScope,
              validBookId,
            );
      return res.json(posts);
    } catch (err) {
      console.error('[Community] getPosts error:', err);
      return res.status(500).json({ message: 'Failed to load posts.' });
    }
  }

  @Get('books')
  async getBooksWithPosts(@Query('q') q: string, @Res() res: Response) {
    try {
      const books = await this.communityService.getBooksWithPosts(q || undefined);
      return res.json(books);
    } catch {
      return res.json([]);
    }
  }

  @Get('tags/trending')
  async getTrendingTags(@Res() res: Response) {
    try {
      const tags = await this.communityService.getTrendingTags();
      return res.json(tags);
    } catch {
      return res.json([]);
    }
  }

  @Post('posts')
  async createPost(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const userId = await this.getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { bookId, content, tags } = body;
    const bookIdNum = Number(bookId);
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!Number.isInteger(bookIdNum) || bookIdNum <= 0 || !trimmedContent) {
      return res.status(400).json({ message: 'bookId and content are required.' });
    }
    if (trimmedContent.length > 2000) {
      return res.status(400).json({ message: 'Post content cannot exceed 2000 characters.' });
    }

    const cleanTags = (Array.isArray(tags) ? tags : [])
      .filter((t: unknown): t is string => typeof t === 'string')
      .map((t: string) => t.replace(/^#/, '').toLowerCase().trim())
      .filter((t: string) => /^[a-z0-9_-]{1,30}$/.test(t))
      .slice(0, 5);

    try {
      const post = await this.communityService.createPost(
        userId,
        bookIdNum,
        trimmedContent,
        cleanTags,
      );
      return res.status(201).json(post);
    } catch (err: any) {
      if (err.statusCode === 422) {
        return res.status(422).json({ message: err.message });
      }
      if (err.statusCode === 503) {
        return res.status(503).json({ message: err.message });
      }
      if (err?.code === '23503') {
        return res.status(400).json({ message: 'That book could not be found.' });
      }
      console.error('[Community] createPost error:', err);
      return res.status(500).json({ message: 'Failed to create post.' });
    }
  }

  @Post('comments')
  async createComment(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    const userId = await this.getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { postId, content, parentCommentId } = body;
    const postIdNum = Number(postId);
    const trimmedContent = typeof content === 'string' ? content.trim() : '';

    if (!Number.isInteger(postIdNum) || postIdNum <= 0 || !trimmedContent) {
      return res.status(400).json({ message: 'postId and content are required.' });
    }
    if (trimmedContent.length > 2000) {
      return res.status(400).json({ message: 'Comment cannot exceed 2000 characters.' });
    }

    const parentId =
      parentCommentId != null && Number.isInteger(Number(parentCommentId))
        ? Number(parentCommentId)
        : null;

    try {
      const comment = await this.communityService.createComment(
        userId,
        postIdNum,
        trimmedContent,
        parentId,
      );
      return res.status(201).json(comment);
    } catch (err: any) {
      if (err.statusCode === 422) return res.status(422).json({ message: err.message });
      if (err.statusCode === 503) return res.status(503).json({ message: err.message });
      if (err.statusCode === 400) return res.status(400).json({ message: err.message });
      if (err?.code === '23503') return res.status(400).json({ message: 'That post could not be found.' });
      console.error('[Community] createComment error:', err);
      return res.status(500).json({ message: 'Failed to post comment.' });
    }
  }
}
