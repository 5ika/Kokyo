# 🚍 Kokyo

Kokyo est un chatbot qui permet d’obtenir rapidement des informations sur les transports en commun dans toute la Suisse.
Pour le moment, il fonctionne uniquement sur Telegram.

## Configuration

1. Récupérer une clé API sur https://opentransportdata.swiss
2. Créer un bot Telegram et récupérer son token: https://core.telegram.org/bots
3. Ajouter ces informations dans le fichier `.env:`

```bash
cp .env.example .env
vi .env
```

## CLI

```bash
deno task cli
```

## Telegram bot

```bash
deno task telegram
```

Pour le mode dev (watching):

```bash
deno task telegram-dev
```