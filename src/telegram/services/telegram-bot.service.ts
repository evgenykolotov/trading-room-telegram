import { Api } from 'telegram';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { removeMarkdown } from 'src/common/utils/remove-markdown.utils';
import { convertEntities } from 'src/common/utils/convert-entities.utils';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(@InjectBot() private bot: Telegraf) {}

  public async sendMessageToChannel(
    channelId: number,
    message: Api.Message,
  ): Promise<void> {
    return message.photo
      ? await this.sendPhotoToChannel(channelId, message)
      : await this.sendTextMessageToChannel(channelId, message);
  }

  private async sendTextMessageToChannel(
    channelId: number,
    message: Api.Message,
  ): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(
        channelId,
        removeMarkdown(message.text),
        {
          link_preview_options: { is_disabled: true },
          entities: convertEntities(message.entities ?? []),
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Ошибка при отправке текстового сообщения в канал ${channelId}`,
        error,
      );
    }
  }

  private async sendPhotoToChannel(
    channelId: number,
    message: Api.Message,
  ): Promise<void> {
    try {
      const media = await message.downloadMedia();
      if (media instanceof Buffer) {
        await this.bot.telegram.sendPhoto(
          channelId,
          { source: media },
          {
            caption: removeMarkdown(message.text),
            caption_entities: convertEntities(message.entities ?? []),
          },
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Ошибка при отправке сообщения c фото в канал ${channelId}`,
        error,
      );
    }
  }
}
