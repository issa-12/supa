import { Module } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { FriendsModule } from './friends/friends.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { StatsModule } from './stats/stats.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [SupabaseModule, AuthModule, BooksModule, FriendsModule, NotificationsModule, RecommendationsModule, StatsModule],
  controllers: [HealthController],
})
export class AppModule {}
