import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Called and left a voicemail.' })
  @IsString()
  @IsNotEmpty({ message: 'Note content cannot be empty' })
  content: string;
}
