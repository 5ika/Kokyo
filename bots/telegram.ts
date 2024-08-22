import { Telegram, getUpdates } from "@gramio/wrappergram";
import { findStops } from "@api/locationInformationRequest.ts";
import { InlineKeyboard } from "@gramio/keyboards";
import { getNextDepartures } from "@api/stopEvent.ts";
import logger from "@lib/logger.ts";
import * as kvdb from "../lib/kvdb.ts";

const telegram = new Telegram(Deno.env.get("TELEGRAM_TOKEN") as string);

const formatContent = (content?: string) =>
  content
    ?.replaceAll("-", "\\-")
    .replaceAll(".", "\\.")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");

const sendMessage = async (message: any) => {
  await telegram.api.sendMessage(message);
};

const getUsername = (from: From) => {
  let username = `id:${from.id}`;
  if (from.username) username = `user:${from.username}`;
  if (from.first_name && from.last_name)
    return `${from.first_name} ${from.last_name} (${username})`;
  else return username;
};

for await (const update of getUpdates(telegram)) {
  logger.debug(JSON.stringify(update, null, 4));
  // On new message
  if (update.message) {
    if (!update.message?.from) {
      console.error("No 'from' in message");
      continue;
    }

    const { from, text, location } = update.message;

    logger.info(
      `New message from ${getUsername(from)}: ${
        text || JSON.stringify(location)
      }`
    );

    telegram.api.setMyCommands({
      commands: [
        { command: "aide", description: "Explique comment utiliser le bot" },
        {
          command: "favoris",
          description: "Affiche la liste de vos arrêts favoris",
        },
      ],
    });

    if (text === "/aide" || text === "/start") {
      const inlineKeyboard = new InlineKeyboard().url(
        "Plus d'infos",
        "https://5ika.ch/kokyo/"
      );
      await sendMessage({
        chat_id: from.id,
        reply_markup: inlineKeyboard,
        text: `Hey ✋ !
Je suis un bot qui te permet d'obtenir rapidement des informations sur les transports en commun dans toute la Suisse 🇨🇭
Entre le nom d'un arrêt et laisse-toi guider !

📍 Tu peux aussi envoyer ta position GPS et je liste les arrêts à proximité.

🧑‍💻 Ce bot est en cours de développement actif. Il se peut qu'il y ait encore quelques instabilités.

/aide - Affiche ce message
/favoris - Affiche vos favoris`,
      });
    } else if (text === "/favoris") {
      const userId = `telegram:${from.id}`;
      const favorites = kvdb.getUserFavorites(userId);

      let inlineKeyboard = new InlineKeyboard();
      for await (const favorite of favorites)
        inlineKeyboard = inlineKeyboard
          .text(favorite.value.name, {
            cmd: "nextDepartures",
            stopRef: favorite.value.stopRef,
          })
          .row();

      await sendMessage({
        chat_id: from.id,
        text: "Voici vos favoris",
        reply_markup: inlineKeyboard,
      });
    } else {
      telegram.api.sendChatAction({
        chat_id: from.id,
        action: "find_location",
      });
      const searchInput = location ? location : text;
      const stopLists = await findStops(searchInput);
      if (!stopLists?.length) {
        await sendMessage({
          chat_id: from.id,
          text: "Désolé, je n'ai pas réussi à récupérer une liste d'arrêts correspondants.",
        });
      } else {
        kvdb.saveStops(stopLists);
        let keyboard = new InlineKeyboard();
        for (const stop of stopLists)
          keyboard = keyboard
            .text(stop.name, { cmd: "nextDepartures", stopRef: stop.stopRef })
            .row();

        await sendMessage({
          chat_id: from.id,
          text: "Quel arrêt correspond ?",
          reply_markup: keyboard,
        });
      }
    }
  }

  // On keyboard event (callback query)
  else if (update.callback_query) {
    const { from, data, message } = update.callback_query;
    const userId = `telegram:${from.id}`;
    const payload = JSON.parse(data);

    logger.info(`New request from ${getUsername(from)}: ${data}`);

    if (payload?.cmd === "nextDepartures") {
      telegram.api.sendChatAction({
        chat_id: from.id,
        action: "find_location",
      });
      const nextDepartures = await getNextDepartures(payload.stopRef);
      const stop = await kvdb.getStopByRef(payload.stopRef);
      const text = formatContent(`Prochains départs depuis *${
        stop.value?.name || "n.c."
      }*:\n
${nextDepartures
  .map(
    item =>
      `*${item.serviceName}*  ${item.serviceTypeIcon}    *${item.departure}*    _${item.departureIn} min_     \n${item.to}\n`
  )
  .join("\n")}`);

      let keyboard = new InlineKeyboard()
        .text("Rafraîchir", {
          cmd: "nextDepartures",
          stopRef: payload.stopRef,
          refresh: message.message_id,
        })
        .text("Localiser", {
          cmd: "localizeStop",
          stopRef: payload.stopRef,
        });

      const existingFavorite = await kvdb.getUserFavorite(
        userId,
        payload.stopRef
      );
      if (!existingFavorite?.value)
        keyboard = keyboard.row().text("Enregistrer comme favoris", {
          cmd: "saveFavorite",
          stopRef: payload.stopRef,
        });

      await sendMessage({
        chat_id: from.id,
        parse_mode: "MarkdownV2",
        text,
        reply_markup: keyboard,
      });
    } else if (payload?.cmd === "localizeStop") {
      const stop = await kvdb.getStopByRef(payload.stopRef);
      if (stop.value?.geoPosition)
        await telegram.api.sendLocation({
          chat_id: from.id,
          longitude: stop.value.geoPosition.longitude,
          latitude: stop.value.geoPosition.latitude,
        });
      else
        sendMessage({
          chat_id: from.id,
          text: "Pas de coordonnées associées à cet arrêt.",
        });
    } else if (payload?.cmd === "saveFavorite") {
      const stop = await kvdb.getStopByRef(payload.stopRef);
      if (stop?.value) await kvdb.saveUserFavorite(userId, stop.value);
      await sendMessage({
        chat_id: from.id,
        parse_mode: "MarkdownV2",
        text: `L'arrêt *${formatContent(
          stop.value?.name
        )}* a été enregistré dans vos /favoris`,
      });
    }
  }
}
