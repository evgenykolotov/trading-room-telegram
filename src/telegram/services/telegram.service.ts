import { Api } from 'telegram';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TelegramClientProvider } from '../providers/telegram-client.provider';
import { removeMarkdown } from 'src/common/utils/remove-markdown.utils';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramBotService: TelegramBotService,
    private readonly telegramClientProvider: TelegramClientProvider,
  ) {}

  onModuleInit(): void {
    const client = this.telegramClientProvider.getClient();

    const MARKET_TWITS_CHANNEL_ID: string = this.configService.get(
      'MARKET_TWITS_CHANNEL_ID',
    ) as string;

    const TRADING_ROOM_GROUP_ID: string = this.configService.get(
      'TRADING_ROOM_GROUP_ID',
    ) as string;

    client.addEventHandler(
      (event: NewMessageEvent) => {
        void (async () => {
          const message = event.message;
          const hashtags = this.extractHashtagsFromEntities(message);

          if (hashtags.length) {
            if (
              hashtags.includes('россия') ||
              hashtags.includes('календарь') ||
              hashtags.includes('геополитика') ||
              event.message.text.includes('🇷🇺') ||
              event.message.text.includes('🇺🇦') ||
              message.text.toUpperCase().includes('КАЛЕНДАРЬ НА СЕГОДНЯ')
            ) {
              return this.telegramBotService.sendMessageToChannel(
                +TRADING_ROOM_GROUP_ID,
                message,
              );
            }
          }
        })();
      },
      new NewMessage({ chats: [MARKET_TWITS_CHANNEL_ID] }),
    );

    this.logger.log('Listening for new messages...');
  }

  private extractHashtagsFromEntities(message: Api.Message): string[] {
    const hashtags: string[] = [];

    if (message.entities) {
      for (const entity of message.entities) {
        if (entity instanceof Api.MessageEntityHashtag) {
          const text: string = removeMarkdown(message.text);
          const hashtagText = text.substring(
            entity.offset,
            entity.offset + entity.length,
          );
          hashtags.push(hashtagText.slice(1));
        }
      }
    }

    return hashtags;
  }
}
