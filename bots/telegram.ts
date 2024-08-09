import { Telegram, getUpdates } from "@gramio/wrappergram";
import { findStopByName } from "@api/locationInformationRequest.ts";
import { InlineKeyboard } from "@gramio/keyboards";
import { getNextDepartures } from "@api/stopEvent.ts";
import logger from "@lib/logger.ts";

const telegram = new Telegram(Deno.env.get("TELEGRAM_TOKEN") as string);

const formatContent = (content: string) =>
  content
    .replaceAll("-", "\\-")
    .replaceAll(".", "\\.")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");

for await (const update of getUpdates(telegram)) {
  console.log(update);

  // On new message
  if (update.message) {
    if (!update.message?.from) {
      console.error("No 'from' in message");
      continue;
    }

    logger.info(
      `New message from ${update.message.from.username}: ${update.message.text}`
    );

    telegram.api.setMyCommands({
      commands: [
        { command: "aide", description: "Explique comment utiliser le bot" },
      ],
    });

    if (update.message.text === "/aide") {
      telegram.api.sendMessage({
        chat_id: update.message.from.id,
        text: `Hey ! Je suis un bot qui te permet d'obtenir rapidement des informations sur les transports en commun dans toute la Suisse.
Entre le nom d'un arrêt et laisse-toi guider !

> Ce bot est en cours de développement actif. Les fonctionnalités sont pour le moment limitées.

/aide - Affiche ce message`,
      });
    } else {
      const stopLists = await findStopByName(update.message.text);
      let keyboard = new InlineKeyboard();
      for (const stop of stopLists)
        keyboard = keyboard
          .text(stop.name, {
            stopName: stop.name?.slice(0, 20),
            stopRef: stop.stopRef,
          })
          .row();

      const response = await telegram.api.sendMessage({
        chat_id: update.message.from.id,
        text: "Quel arrêt correspond ?",
        reply_markup: keyboard,
      });
      console.log(response, keyboard);
    }
  }

  // On keyboard event (callback query)
  else if (update.callback_query) {
    const payload = JSON.parse(update.callback_query.data);

    logger.info(
      `New request from ${update.callback_query.from.username}: ${payload.stopName} (${payload.stopRef})`
    );

    if (payload?.stopRef) {
      const nextDepartures = await getNextDepartures(payload.stopRef);
      const text = formatContent(`Prochains départs depuis *${
        payload.stopName
      }*:\n
${nextDepartures
  .map(
    item =>
      `*${item.departure}*    _${item.departureIn} min_   *${item.serviceName}*  ${item.serviceTypeIcon}    ${item.to}`
  )
  .join("\n")}`);
      const response = await telegram.api.sendMessage({
        chat_id: update.callback_query.from.id,
        parse_mode: "MarkdownV2",
        text,
      });
      console.log(response);
    }
  }
}
