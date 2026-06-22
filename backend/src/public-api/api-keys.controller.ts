import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiKeyService } from './api-key.service';
import { ApiKeyDto, CreateApiKeyDto, CreatedApiKeyDto } from './dto/api-key.dto';

// Management endpoints for a signed-in user (Supabase JWT) to mint, list, and
// revoke their own consumer API keys. These live OUTSIDE the public API surface
// (they authenticate with the user session, not an API key).
@ApiTags('API Keys (management)')
@ApiBearerAuth('jwt')
@Controller('keys')
export class ApiKeysController {
  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly supabase: SupabaseService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key (the secret is returned once)' })
  @ApiCreatedResponse({ type: CreatedApiKeyDto })
  async create(
    @Headers('authorization') auth: string,
    @Body() body: CreateApiKeyDto,
  ): Promise<CreatedApiKeyDto> {
    const userId = await this.requireUser(auth);
    const name = (body?.name ?? '').trim() || 'Default key';
    if (name.length > 60) throw new BadRequestException('Name must be 60 characters or fewer.');
    return this.apiKeys.create(userId, name);
  }

  @Get()
  @ApiOperation({ summary: 'List your API keys (prefixes only, never the secret)' })
  @ApiOkResponse({ type: ApiKeyDto, isArray: true })
  async list(@Headers('authorization') auth: string): Promise<ApiKeyDto[]> {
    const userId = await this.requireUser(auth);
    return this.apiKeys.list(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiOkResponse({ schema: { example: { revoked: true } } })
  async revoke(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ): Promise<{ revoked: true }> {
    const userId = await this.requireUser(auth);
    return this.apiKeys.revoke(userId, id);
  }

  private async requireUser(auth: string): Promise<string> {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    const userId = await this.supabase.getVerifiedUserId(token);
    if (!userId) throw new UnauthorizedException('Authentication required.');
    return userId;
  }
}
