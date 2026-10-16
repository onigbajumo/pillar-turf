import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { HttpError } from "./auth";
import { connectDB } from "./db";

/** Wraps a route handler: connects to the DB and turns thrown errors into JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      await connectDB();
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input." }, { status: 422 });
      if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 11000)
        return NextResponse.json({ error: "That already exists." }, { status: 409 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 });
    }
  };
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });

export function oid(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Not found.");
  return new mongoose.Types.ObjectId(id);
}

/** Converts lean Mongo documents to plain JSON (ObjectIds and Dates become strings). */
export function plain<T>(v: T): Plain<T> {
  return JSON.parse(JSON.stringify(v));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Plain<T> = any;
