# MP MARKET — Mpumalanga's local marketplace

**Brand:** MP MARKET — Buy Local. Sell Smart.  
**Owner:** Majorglory Group (Pty) Ltd  
**Launch coverage:** Entire Mpumalanga. Marketing focus: Nkomazi and Mbombela.  
**Palette:** forest green, mint and white.

## Production connections
The frontend lives in `index.html` on GitHub Pages-compatible static hosting. It is connected to the existing **Photography** Supabase project `tjlanldknskbahzxwecw`.

**IMPORTANT:** MP MARKET data is isolated in `mp_`-prefixed tables and the separate `mp-listing-images` bucket. Do not rename or delete the Photography tables or its buckets.

## Implemented
- Responsive Mpumalanga marketplace homepage and search by area/category
- Email/password signup, sign-in, and a personal account dashboard (Supabase Auth)
- Publish products with up to five photos (Supabase Storage)
- Saved listings, direct seller messaging, reporting and listing management
- MP AI widget: live-listing matching fallback in browser, Edge Function `mp-listing-ai` for generative AI when the server secret `OPENAI_API_KEY` is configured
- A business promotion section (future paid plans; no payments processed yet)
- No fabricated product listings or sales metrics

## Activate the website
1. In GitHub repository **Settings → Pages**, select **Deploy from a branch**, branch `main`, folder `/(root)`, then save.
2. In Supabase → Authentication → URL Configuration, add the GitHub Pages website URL to **Redirect URLs**. Set the desired Site URL and email confirmation workflow.
3. Test real signup, confirmation, login, listing creation, photo upload, second-account messaging, favourites, and reporting.
4. In Supabase Edge Functions secrets, configure `OPENAI_API_KEY` to activate the hosted AI. Keep it server-side only. The AI function is already deployed but cannot call the provider without that key.
5. For a moderator, add their real auth user ID to `mp_admins` using the protected SQL Editor. Never grant admin access through client-side code.

## Not yet production-complete
- Payments, seller subscriptions, transaction escrow, automated delivery, verified identity, password reset UI, moderation automation, and anti-spam/rate limits.
- Terms, privacy, prohibited items policy, and consumer compliance review.
- Security and usability acceptance testing with two real accounts and uploaded photos.
- Automated tests and production monitoring.

**Privacy/security:** Only the public Supabase publishable key is embedded in the website, never a service-role/secret key. Supabase Row Level Security protects the new marketplace tables. Marketplace product images are public; never upload ID documents to that bucket.

## Database
Tables provisioned through the Supabase integration:
`mp_profiles`, `mp_listings`, `mp_listing_images`, `mp_favorites`, `mp_conversations`, `mp_messages`, `mp_reports`, `mp_admins`.

Source repository: https://github.com/cmstudiop-ops/mpmarket
