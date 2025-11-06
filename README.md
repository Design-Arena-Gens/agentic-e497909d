# Instagram Auto DM Agent

Automate direct messages on Instagram using reusable templates, merge tags, and instant execution through the Instagram Graph API. This project ships with a React interface (Next.js App Router) plus an API endpoint that relays requests to Meta.

## Requirements

- Node.js 18+
- Instagram Business account connected to a Facebook page
- Meta app with the Instagram Messaging feature enabled
- Long lived Instagram access token with `instagram_manage_messages`
- Instagram Business Account ID that is approved for messaging

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an `.env.local` file and populate it using the template below:

   ```bash
   cp .env.example .env.local
   ```

   Update the values with your Instagram credentials.

3. Run the development server:

   ```bash
   npm run dev
   ```

   The app will render at `http://localhost:3000`.

## Usage

- **Real-Time Message Composer**: enter the recipient Instagram user ID, pick a template, adjust the message, and optionally supply a CTA button. Submit to hit `POST /api/send-dm`, which posts to `/{ig_business_account_id}/messages` on the Graph API.
- **Template Control Center**: curate reusable DM blueprints. Templates persist locally in `localStorage` for fast iteration.
- **Automation Notes**: the UI is designed to pair with external workflow tools (Zapier, Make, n8n, cron jobs). Trigger webhooks that send POST requests to `/api/send-dm` with the payload used in the UI.
- **Delivery Timeline**: view the last 25 DM payloads and Graph message IDs. This list is stored locally in the browser so you can copy the data into your CRM or analytics pipeline.

## API Reference

```
POST /api/send-dm
Content-Type: application/json

{
  "recipientId": "1784...",
  "message": "Hi {{first_name}}!",
  "messagingTag": "ACCOUNT_UPDATE",
  "ctaLabel": "View Offer",
  "ctaUrl": "https://example.com",
  "accessToken": "optional override",
  "businessAccountId": "optional override"
}
```

If the optional fields are not supplied, the endpoint falls back to the environment variables declared in `.env.local`.

## Deployment

Deploy directly to Vercel once the build passes:

```bash
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-e497909d
```

Verify the deployment after DNS propagates:

```bash
curl https://agentic-e497909d.vercel.app
```

## Notes

- The Graph API will reject messages that do not respect Instagram policy. Use approved message tags for each scenario.
- Replace merge tags (e.g., `{{first_name}}`) before POSTing to `/api/send-dm`.
- Extend this agent with a scheduler or persistent task store to deliver drip sequences or respond to real-time events.
