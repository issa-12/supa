import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { FriendsModule } from './friends/friends.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [SupabaseModule, AuthModule, BooksModule, FriendsModule, NotificationsModule, RecommendationsModule, StatsModule],
})
export class AppModule {}
