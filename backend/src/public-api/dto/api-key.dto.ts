import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My integration', maxLength: 60, description: 'A label to recognise this key later.' })
  name!: string;
}

export class ApiKeyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'My integration' })
  name!: string;

  @ApiProperty({ example: 'rt_live_AbCd', description: 'Non-secret display prefix of the key.' })
  keyPrefix!: string;

  @ApiProperty({ type: [String], example: ['read', 'write'] })
  scopes!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ nullable: true })
  lastUsedAt!: string | null;

  @ApiProperty({ nullable: true })
  revokedAt!: string | null;

  @ApiProperty({ nullable: true })
  expiresAt!: string | null;
}

export class CreatedApiKeyDto extends ApiKeyDto {
  @ApiProperty({
    example: 'rt_live_AbCd1234…',
    description: 'The full secret key. Shown ONCE at creation and never retrievable again — store it now.',
  })
  key!: string;
}
