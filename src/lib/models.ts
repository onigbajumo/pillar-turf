import mongoose, { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const { ObjectId } = Schema.Types;

const mediaSchema = new Schema(
  { url: String, publicId: String, type: { type: String, enum: ["image", "video"], default: "image" } },
  { _id: false },
);

/* ---------- Admin users ---------- */
const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // owner can manage other admins; admin manages tournaments only
    role: { type: String, enum: ["owner", "admin"], default: "admin" },
    // bumped on password change so older sessions stop working
    passwordVersion: { type: Number, default: 1 },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

/* ---------- Tournaments ---------- */
const tournamentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    year: { type: Number, required: true, index: true },
    slug: { type: String, required: true, unique: true },
    venue: { type: String, default: "Pillars Turf" },
    tagline: { type: String, default: "" },
    format: { type: String, default: "League" },
    published: { type: Boolean, default: true },
    points: {
      win: { type: Number, default: 3 },
      draw: { type: Number, default: 1 },
      loss: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

/* ---------- Teams (belong to one tournament) ---------- */
const teamSchema = new Schema(
  {
    tournament: { type: ObjectId, ref: "Tournament", required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#1f5fa8" },
    photo: { type: mediaSchema, default: null },
    squad: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

/* ---------- Matches ---------- */
const scorerSchema = new Schema({ name: { type: String, required: true }, goals: { type: Number, default: 1 } }, { _id: false });

const matchSchema = new Schema(
  {
    tournament: { type: ObjectId, ref: "Tournament", required: true, index: true },
    home: { type: ObjectId, ref: "Team", required: true },
    away: { type: ObjectId, ref: "Team", required: true },
    round: { type: Number, default: 1 },
    no: { type: Number, default: 0 },
    date: { type: String, default: "" }, // YYYY-MM-DD
    time: { type: String, default: "" }, // free text, e.g. "8:12–8:22 AM"
    played: { type: Boolean, default: false },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    homeScorers: { type: [scorerSchema], default: [] },
    awayScorers: { type: [scorerSchema], default: [] },
  },
  { timestamps: true },
);

/* ---------- Awards ---------- */
const awardSchema = new Schema(
  {
    tournament: { type: ObjectId, ref: "Tournament", required: true, index: true },
    // fixed slots use keys like "mvp", "boot", "md1-potd"; custom awards use "custom-<id>"
    key: { type: String, required: true },
    title: { type: String, required: true },
    scope: { type: String, enum: ["tournament", "matchday", "custom"], default: "tournament" },
    round: { type: Number, default: null },
    winner: { type: String, default: "" },
    team: { type: ObjectId, ref: "Team", default: null },
    note: { type: String, default: "" },
    media: { type: mediaSchema, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
awardSchema.index({ tournament: 1, key: 1 }, { unique: true });

export type AdminUserDoc = InferSchemaType<typeof adminUserSchema> & { _id: mongoose.Types.ObjectId };
export type TournamentDoc = InferSchemaType<typeof tournamentSchema> & { _id: mongoose.Types.ObjectId };

export const AdminUser = (models.AdminUser as Model<InferSchemaType<typeof adminUserSchema>>) || model("AdminUser", adminUserSchema);
export const Tournament = (models.Tournament as Model<InferSchemaType<typeof tournamentSchema>>) || model("Tournament", tournamentSchema);
export const Team = (models.Team as Model<InferSchemaType<typeof teamSchema>>) || model("Team", teamSchema);
export const Match = (models.Match as Model<InferSchemaType<typeof matchSchema>>) || model("Match", matchSchema);
export const Award = (models.Award as Model<InferSchemaType<typeof awardSchema>>) || model("Award", awardSchema);
