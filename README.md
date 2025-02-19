# <YOUR_APP_NAME>

This project is based on [OpenSaas](https://opensaas.sh) template and consists of three main dirs:

1. `app` - Your web app, built with [Wasp](https://wasp-lang.dev).
2. `e2e-tests` - [Playwright](https://playwright.dev/) tests for your Wasp web app.
3. `blog` - Your blog / docs, built with [Astro](https://docs.astro.build) based on [Starlight](https://starlight.astro.build/) template.

For more details, check READMEs of each respective directory!

# Development

Install dependencies

```sh
npm install
```

[Optional] Install `wasp` globally

```sh
~/ $ curl -sSL https://get.wasp.sh/installer.sh | sh
```

Docker

- Install docker desktop ensure daemon is running

Upgrade node version if needed

```sh
nvm install 18.18.0
nvm use 18.18.0
```

Start `wasp` database

```sh
wasp db start
```

_local database credentials will be printed in the console like `postgresql://postgresWaspDevUser:postgresWaspDevPass@localhost:5432/BlockSpot-1fa0f53b02`_

Migrate database

```sh
wasp db migrate-dev
```

Start `wasp` service

```sh
wasp start
```

### Setup Stripe

https://docs.opensaas.sh/guides/payments-integration/#install-the-stripe-cli

Steps

1. Get Dev API key from Stripe UI -- Add to `.env.server`
2. `stripe login`
3. `stripe listen --forward-to localhost:3001/payments-webhook`
