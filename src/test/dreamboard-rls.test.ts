import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

const url = process.env['VITE_SUPABASE_URL'];
const key = process.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const token = process.env['LOVABLE_BROWSER_SUPABASE_ACCESS_TOKEN'];
const session = process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const owner = session ? JSON.parse(session).user.id as string : undefined;
const foreign = "00000000-0000-4000-8000-000000000001";

describe.skipIf(!url || !key || !token || !owner)("Live dreamboard RLS", () => {
  async function request(path: string, method = "GET", body?: unknown, authenticated = true) {
    const headers: Record<string, string> = { apikey: key ?? "", "Content-Type": "application/json", Prefer: "return=representation" };
    if (authenticated) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${url}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  }

  it("blocks anonymous read, insert, update, and delete on all three data tables", async () => {
    for (const table of ["bucket_items", "bucket_replies", "bucket_photos"]) {
      for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
        const result = await request(`/rest/v1/${table}?id=eq.${foreign}`, method, method === "POST" || method === "PATCH" ? {} : undefined, false);
        expect(result.status, `${table} ${method}`).toBeGreaterThanOrEqual(400);
      }
    }
  });

  it("permits shared-account dream CRUD but rejects foreign ownership and ownership transfer", async () => {
    const id = randomUUID();
    try {
      expect((await request("/rest/v1/bucket_items", "POST", { id, title: "RLS verification", target_year: "2026" })).status).toBe(201);
      expect((await request(`/rest/v1/bucket_items?id=eq.${id}`)).data).toHaveLength(1);
      expect((await request(`/rest/v1/bucket_items?id=eq.${id}`, "PATCH", { description: "Verified owner update" })).status).toBe(200);
      expect((await request(`/rest/v1/bucket_items?id=eq.${id}`, "PATCH", { user_id: foreign })).status).toBe(403);
      expect((await request("/rest/v1/bucket_items", "POST", { user_id: foreign, title: "Denied", target_year: "2026" })).status).toBe(403);
      expect((await request(`/rest/v1/bucket_items?user_id=eq.${foreign}`)).data).toEqual([]);
      expect((await request(`/rest/v1/bucket_items?user_id=eq.${foreign}`, "PATCH", { description: "Denied" })).data).toEqual([]);
      expect((await request(`/rest/v1/bucket_items?user_id=eq.${foreign}`, "DELETE")).data).toEqual([]);
    } finally {
      expect((await request(`/rest/v1/bucket_items?id=eq.${id}`, "DELETE")).status).toBe(200);
      expect((await request(`/rest/v1/bucket_items?id=eq.${id}`)).data).toEqual([]);
    }
  });

  it("requires reply ownership and parent ownership and denies reply updates", async () => {
    const id = randomUUID();
    const reply = randomUUID();
    try {
      expect((await request("/rest/v1/bucket_items", "POST", { id, title: "Reply RLS verification", target_year: "2026" })).status).toBe(201);
      expect((await request("/rest/v1/bucket_replies", "POST", { id: reply, item_id: id, body: "Owner reply" })).status).toBe(201);
      expect((await request(`/rest/v1/bucket_replies?id=eq.${reply}`)).data).toHaveLength(1);
      expect((await request("/rest/v1/bucket_replies", "POST", { item_id: id, user_id: foreign, body: "Denied" })).status).toBe(403);
      expect((await request("/rest/v1/bucket_replies", "POST", { item_id: foreign, body: "Denied" })).status).toBe(403);
      expect((await request(`/rest/v1/bucket_replies?id=eq.${reply}`, "PATCH", { body: "Denied" })).status).toBe(403);
      expect((await request(`/rest/v1/bucket_replies?id=eq.${reply}`, "DELETE")).status).toBe(200);
    } finally { await request(`/rest/v1/bucket_items?id=eq.${id}`, "DELETE"); }
  });

  it("requires owner photo paths and completed owned parents and denies photo updates", async () => {
    const id = randomUUID();
    const photo = randomUUID();
    const path = `${owner}/${photo}.jpg`;
    try {
      expect((await request("/rest/v1/bucket_items", "POST", { id, title: "Photo RLS verification", target_year: "2026" })).status).toBe(201);
      expect((await request("/rest/v1/bucket_photos", "POST", { kind: "memory", item_id: id, storage_path: path })).status).toBe(403);
      expect((await request(`/rest/v1/bucket_items?id=eq.${id}`, "PATCH", { done: true })).status).toBe(200);
      expect((await request("/rest/v1/bucket_photos", "POST", { id: photo, kind: "memory", item_id: id, storage_path: path })).status).toBe(201);
      expect((await request(`/rest/v1/bucket_photos?id=eq.${photo}`)).data).toHaveLength(1);
      expect((await request("/rest/v1/bucket_photos", "POST", { kind: "background", storage_path: `${foreign}/denied.jpg` })).status).toBe(403);
      expect((await request("/rest/v1/bucket_photos", "POST", { kind: "memory", item_id: foreign, storage_path: path })).status).toBe(403);
      expect((await request(`/rest/v1/bucket_photos?id=eq.${photo}`, "PATCH", { storage_path: path })).status).toBe(403);
      expect((await request(`/rest/v1/bucket_photos?id=eq.${photo}`, "DELETE")).status).toBe(200);
    } finally { await request(`/rest/v1/bucket_items?id=eq.${id}`, "DELETE"); }
  });

  it("allows private owner-file upload and signing but denies anonymous and foreign-folder access", async () => {
    const path = `${owner}/${randomUUID()}.jpg`;
    const headers = { apikey: key ?? "", Authorization: `Bearer ${token}`, "Content-Type": "image/jpeg" };
    try {
      const own = await fetch(`${url}/storage/v1/object/dream-photos/${path}`, { method: "POST", headers, body: new Uint8Array([255, 216, 255, 217]) });
      expect(own.status).toBe(200);
      expect((await request(`/storage/v1/object/sign/dream-photos/${path}`, "POST", { expiresIn: 60 })).status).toBe(200);
      const anonymous = await request(`/storage/v1/object/sign/dream-photos/${path}`, "POST", { expiresIn: 60 }, false);
      expect(anonymous.status).toBeGreaterThanOrEqual(400);
      const denied = await fetch(`${url}/storage/v1/object/dream-photos/${foreign}/${randomUUID()}.jpg`, { method: "POST", headers, body: new Uint8Array([255, 216, 255, 217]) });
      expect(denied.status).toBeGreaterThanOrEqual(400);
      expect((await request(`/storage/v1/object/sign/dream-photos/${foreign}/denied.jpg`, "POST", { expiresIn: 60 })).status).toBeGreaterThanOrEqual(400);
    } finally {
      expect((await request("/storage/v1/object/dream-photos", "DELETE", { prefixes: [path] })).status).toBe(200);
    }
  });
});