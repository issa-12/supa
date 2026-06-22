import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard, AuthedRequest } from './api-key.guard';
import { PublicShelfService } from './public-shelf.service';
import {
  CreateShelfItemDto,
  ReplaceShelfItemDto,
  ShelfItemDto,
  SHELF_STATUSES,
  UpdateShelfItemDto,
} from './dto/shelf-item.dto';

@ApiTags('Shelf')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyGuard)
@Controller('public/v1/shelf')
export class PublicShelfController {
  constructor(private readonly shelf: PublicShelfService) {}

  @Get()
  @ApiOperation({ summary: 'List the authenticated consumer’s shelf items' })
  @ApiQuery({ name: 'status', required: false, enum: SHELF_STATUSES })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', default: 0 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', default: 20, maximum: 100 } })
  @ApiOkResponse({ type: ShelfItemDto, isArray: true })
  list(
    @Req() req: AuthedRequest,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ShelfItemDto[]> {
    return this.shelf.list(this.userId(req), {
      status,
      page: toInt(page, 0),
      limit: toInt(limit, 20),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single shelf item' })
  @ApiOkResponse({ type: ShelfItemDto })
  get(@Req() req: AuthedRequest, @Param('id') id: string): Promise<ShelfItemDto> {
    return this.shelf.get(this.userId(req), +id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a book to the shelf' })
  @ApiCreatedResponse({ type: ShelfItemDto })
  create(@Req() req: AuthedRequest, @Body() body: CreateShelfItemDto): Promise<ShelfItemDto> {
    this.requireWrite(req);
    return this.shelf.create(this.userId(req), body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace a shelf item (idempotent full update)' })
  @ApiOkResponse({ type: ShelfItemDto })
  replace(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: ReplaceShelfItemDto,
  ): Promise<ShelfItemDto> {
    this.requireWrite(req);
    return this.shelf.replace(this.userId(req), +id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a shelf item' })
  @ApiOkResponse({ type: ShelfItemDto })
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: UpdateShelfItemDto,
  ): Promise<ShelfItemDto> {
    this.requireWrite(req);
    return this.shelf.update(this.userId(req), +id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a book from the shelf' })
  @ApiNoContentResponse()
  async remove(@Req() req: AuthedRequest, @Param('id') id: string): Promise<void> {
    this.requireWrite(req);
    await this.shelf.remove(this.userId(req), +id);
  }

  private userId(req: AuthedRequest): string {
    return req.apiConsumer!.userId;
  }

  private requireWrite(req: AuthedRequest): void {
    if (!req.apiConsumer?.scopes.includes('write')) {
      throw new ForbiddenException('This API key lacks the "write" scope.');
    }
  }
}

function toInt(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}
