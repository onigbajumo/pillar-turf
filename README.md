# Pillars Turf

Tournament site for Pillars Turf: league tables, fixtures, results, goalscorers, team photos and awards, with an admin area for organisers.

- **Public site**: anyone with the link sees every published tournament without logging in.
- **Admin area** (`/admin`): organisers log in with email and password to manage tournaments, teams, fixtures, results, photos and awards.
- **Multiple tournaments**: each tournament has a name and a year, e.g. *Pillars Turf Cup 2026*, and has its own short link that admins choose, e.g. `yourdomain.com/ptc26` or even `yourdomain.com/c`. New tournaments can copy teams from a previous one.

Built with Next.js 15 (App Router), MongoDB (Mongoose) and Cloudinary for photos and videos.

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in the values
```

You need a MongoDB database. Either:

- use **MongoDB Atlas** (free tier) and put its connection string in `MONGODB_URI`, or
- run a local one for development in a separate terminal: `npm run db:local` (data is kept in `.mongo-data/`).

Then create the first admin account (the first account is always an **owner**) and start the app:

```bash
npm run admin:create -- --email you@example.com --name "Your Name"
npm run seed:2026               # optional: loads the 2026 Pillars Turf Cup teams and 28 fixtures
npm run dev
```

Open http://localhost:3000 for the public site and http://localhost:3000/admin to log in.

### Environment variables

| Name | What it's for |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Random string (32+ characters) that signs login sessions. Changing it logs everyone out. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary account, for team photos and award media. Without them the site works but uploads are switched off. |
| `CLOUDINARY_FOLDER` | Folder in Cloudinary that uploads go into (default `pillars-turf`) |

## Roles

- **Owner**: everything an admin can do, plus add, remove and reset passwords for admins.
- **Admin**: create and manage tournaments, teams, fixtures, results and awards.

Every admin can change their own password under **My account**. Changing a password logs that account out on other devices.

## How it's organised

```
src/
  app/
    page.tsx                  public home: tournaments grouped by year
    t/[slug]/                 public tournament pages (table, fixtures, teams, awards)
    admin/login               login page
    admin/(panel)/            admin area (tournaments, admins, my account)
    api/auth/*                login and logout
    api/admin/*               admin API (requires login)
    api/public/*              read-only JSON API for other clients
  components/                 shared UI (league table, match row, award card…)
  components/admin/           admin screens
  lib/
    models.ts                 Mongoose models: AdminUser, Tournament, Team, Match, Award
    league.ts                 standings, scorers, award slots, round-robin generator
    auth.ts, session.ts       session cookie (signed JWT) and admin checks
    cloudinary.ts             signed browser uploads and clean-up
scripts/                      create-admin, seed-2026, local MongoDB
```

Uploads go straight from the browser to Cloudinary using a signature issued by `/api/admin/uploads/sign`, so large photos and videos never pass through the server. Replaced or removed media is deleted from Cloudinary.

## Deploying

Any Node host works (Vercel, Render, a VPS). Set the environment variables above, run `npm run build` and `npm start`, then run `npm run admin:create` once against the production database to create the first owner.
