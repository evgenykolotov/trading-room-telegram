import Redis from 'ioredis';
import { Api } from 'telegram';
import {
  EditedMessage,
  EditedMessageEvent,
} from 'telegram/events/EditedMessage';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { TelegramBotService } from './telegram-bot.service';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { removeMarkdown } from 'src/common/utils/remove-markdown.utils';
import { TelegramClientProvider } from '../providers/telegram-client.provider';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
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
              const sentMessage =
                await this.telegramBotService.sendMessageToChannel(
                  +TRADING_ROOM_GROUP_ID,
                  message,
                );

              if (sentMessage) {
                const key = `original_message_id:${message.id}`;
                await this.redis.set(key, sentMessage.message_id, 'EX', 86400);
              }
            }
          }
        })();
      },
      new NewMessage({ chats: [MARKET_TWITS_CHANNEL_ID] }),
    );

    client.addEventHandler(
      (event: EditedMessageEvent) => {
        void (async () => {
          const editedMessage = event.message;
          this.logger.log(`Сообщение отредактировано: ${editedMessage.text}`);
          const sentMessageId = await this.redis.get(
            `original_message_id:${editedMessage.id}`,
          );
          if (sentMessageId) {
            await this.telegramBotService.editMessageToChannel(
              +TRADING_ROOM_GROUP_ID,
              +sentMessageId,
              editedMessage,
            );
          }
        })();
      },
      new EditedMessage({ chats: [MARKET_TWITS_CHANNEL_ID] }),
    );

    this.logger.log('Listening for new messages...');

    this.logger.log('MARKET_TWITS_CHANNEL_ID', MARKET_TWITS_CHANNEL_ID);
    this.logger.log('REDIS_PASSWORD', this.configService.get(
      'REDIS_PASSWORD',
    ));
    this.logger.log('REDIS_URL', this.configService.get(
      'REDIS_URL',
    ));
    this.logger.log('SERVER_HOST', this.configService.get(
      'SERVER_HOST',
    ));
    this.logger.log('SERVER_PORT', this.configService.get(
      'SERVER_PORT',
    ));
    this.logger.log('SERVER_USERNAME', this.configService.get(
      'SERVER_USERNAME',
    ));
    this.logger.log('SSH_PRIVATE_KEY', this.configService.get(
      'SSH_PRIVATE_KEY',
    ));
    this.logger.log('TELEGRAM_API_HASH', this.configService.get(
      'TELEGRAM_API_HASH',
    ));
    this.logger.log('TELEGRAM_API_ID', this.configService.get(
      'TELEGRAM_API_ID',
    ));
    this.logger.log('TELEGRAM_BOT_TOKEN', this.configService.get(
      'TELEGRAM_BOT_TOKEN',
    ));
    this.logger.log('TELEGRAM_SESSION', this.configService.get(
      'TELEGRAM_SESSION',
    ));
    this.logger.log('TEST_GROUP_ID', this.configService.get(
      'TEST_GROUP_ID',
    ));
    this.logger.log('TRADING_ROOM_GROUP_ID', TRADING_ROOM_GROUP_ID);


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
