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
    if (!token) return null;
    const { data } = await this.supabaseService.getAdmin().auth.getUser(token);
    return data.user?.id ?? null;
  }

  @Get('posts')
  async getPosts(
    @Query('tag') tag: string,
    @Query('page') page: string,
    @Query('trending') trending: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = await this.getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const posts =
        trending === 'true'
          ? await this.communityService.getTrendingPosts(userId)
          : await this.communityService.getAllPosts(
              userId,
              tag || undefined,
              parseInt(page ?? '0', 10),
            );
      return res.json(posts);
    } catch (err) {
      console.error('[Community] getPosts error:', err);
      return res.status(500).json({ message: 'Failed to load posts.' });
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
    if (!bookId || !content?.trim()) {
      return res.status(400).json({ message: 'bookId and content are required.' });
    }

    try {
      const post = await this.communityService.createPost(
        userId,
        Number(bookId),
        content.trim(),
        Array.isArray(tags) ? tags : [],
      );
      return res.status(201).json(post);
    } catch (err: any) {
      if (err.statusCode === 422) {
        return res.status(422).json({ message: err.message });
      }
      console.error('[Community] createPost error:', err);
      return res.status(500).json({ message: 'Failed to create post.' });
    }
  }
}
