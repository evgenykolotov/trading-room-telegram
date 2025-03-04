import { Api } from 'telegram';
import { Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { Message, Update } from 'telegraf/types';
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
  ): Promise<Message.PhotoMessage | Message.TextMessage | undefined> {
    return message.photo
      ? await this.sendPhotoToChannel(channelId, message)
      : await this.sendTextMessageToChannel(channelId, message);
  }

  public async editMessageToChannel(
    channelId: number,
    editMessageId: number,
    message: Api.Message,
  ): Promise<
    | true
    | (Update.Edited & Message.TextMessage)
    | (Update.Edited & Message.CaptionableMessage)
    | undefined
  > {
    return message.photo
      ? await this.editPhotoMessageToChannel(channelId, editMessageId, message)
      : await this.editTextMessageToChannel(channelId, editMessageId, message);
  }

  private async sendTextMessageToChannel(
    channelId: number,
    message: Api.Message,
  ): Promise<Message.TextMessage | undefined> {
    try {
      return await this.bot.telegram.sendMessage(
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
  ): Promise<Message.PhotoMessage | undefined> {
    try {
      const media = await message.downloadMedia();
      if (media instanceof Buffer) {
        return await this.bot.telegram.sendPhoto(
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

  private async editTextMessageToChannel(
    channelId: number,
    editMessageId: number,
    message: Api.Message,
  ): Promise<true | (Update.Edited & Message.TextMessage) | undefined> {
    try {
      return await this.bot.telegram.editMessageText(
        channelId,
        editMessageId,
        undefined,
        removeMarkdown(message.text),
        {
          link_preview_options: { is_disabled: true },
          entities: convertEntities(message.entities ?? []),
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Ошибка при редактировании текстового сообщения в канал ${channelId}`,
        error,
      );
    }
  }

  private async editPhotoMessageToChannel(
    channelId: number,
    editMessageId: number,
    message: Api.Message,
  ): Promise<true | (Update.Edited & Message.CaptionableMessage) | undefined> {
    try {
      return await this.bot.telegram.editMessageCaption(
        channelId,
        editMessageId,
        undefined,
        removeMarkdown(message.text),
        {
          caption_entities: convertEntities(message.entities ?? []),
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Ошибка при редактировании сообщения c фото в канал ${channelId}`,
        error,
      );
    }
  }
}
