import { z } from "zod";

const media = z
  .object({ url: z.string().url(), publicId: z.string().min(1), type: z.enum(["image", "video"]) })
  .nullable();
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a team colour.");
const scorer = z.object({ name: z.string().trim().min(1).max(60), goals: z.number().int().min(1).max(50) });
const tally = z.object({ name: z.string().trim().min(1).max(60), count: z.number().int().min(1).max(50) });
const tallies = z.array(tally).max(30).default([]);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const password = z.string().min(8, "Passwords need at least 8 characters.").max(200);

export const adminCreateSchema = z.object({
  name: z.string().trim().min(2, "Enter the admin's name.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  password,
  role: z.enum(["owner", "admin"]).default("admin"),
});

export const adminUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(["owner", "admin"]).optional(),
  password: password.optional(),
});

export const changePasswordSchema = z.object({ current: z.string().min(1, "Enter your current password."), next: password });

export const tournamentCreateSchema = z.object({
  name: z.string().trim().min(2, "Give the tournament a name.").max(80),
  year: z.number().int().min(2000).max(2100),
  tagline: z.string().trim().max(160).default(""),
  venue: z.string().trim().max(80).default("Pillars Turf"),
  slug: z.string().trim().toLowerCase().max(12).optional(), // blank = generate one
  copyTeamsFrom: z.string().optional(),
});

export const tournamentUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  tagline: z.string().trim().max(160).optional(),
  venue: z.string().trim().max(80).optional(),
  slug: z.string().trim().toLowerCase().min(1, "Enter a short link.").max(12).optional(),
  format: z.string().trim().max(40).optional(),
  published: z.boolean().optional(),
  points: z.object({ win: z.number().int().min(0).max(10), draw: z.number().int().min(0).max(10), loss: z.number().int().min(0).max(10) }).optional(),
});

export const teamCreateSchema = z.object({ name: z.string().trim().min(1, "Enter a team name.").max(60), color: hex.default("#1f5fa8") });
export const teamUpdateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: hex.optional(),
  squad: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  photo: media.optional(),
});

export const matchCreateSchema = z.object({
  home: z.string().min(1),
  away: z.string().min(1),
  round: z.number().int().min(1).max(99),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default(""),
  time: z.string().trim().max(40).default(""),
}).refine((m) => m.home !== m.away, "Pick two different teams.");

export const matchUpdateSchema = z.object({
  round: z.number().int().min(1).max(99).optional(),
  no: z.number().int().min(0).optional(),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional(),
  time: z.string().trim().max(40).optional(),
  result: z
    .object({
      homeScore: z.number().int().min(0).max(99), awayScore: z.number().int().min(0).max(99),
      homeScorers: z.array(scorer), awayScorers: z.array(scorer),
      homeAssists: tallies, awayAssists: tallies,
      homeYellows: tallies, awayYellows: tallies,
      homeReds: tallies, awayReds: tallies,
    })
    .nullable()
    .optional(), // null = mark unplayed
});

export const scheduleSchema = z.object({ double: z.boolean().default(false), startDate: z.string().optional() });

export const awardUpsertSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]{1,40}$/),
  title: z.string().trim().min(1).max(60),
  scope: z.enum(["tournament", "matchday", "custom"]),
  round: z.number().int().min(1).nullable().default(null),
  winner: z.string().trim().max(80).default(""),
  team: z.string().nullable().default(null),
  note: z.string().trim().max(240).default(""),
  media: media.default(null),
});

const line = (max: number) => z.string().trim().max(max);
export const siteSchema = z.object({
  sessions: z.array(z.object({ day: line(30).min(1, "Each session needs a day."), time: line(40), deadline: line(20) })).max(14),
  lateRule: line(400),
  rules: z.array(line(400).min(1)).max(40),
  pricePerPlayer: line(40),
  subscription: line(200),
  payment: z.object({ accountNumber: line(30), bank: line(60), accountName: line(80) }),
  closing: line(200),
});
