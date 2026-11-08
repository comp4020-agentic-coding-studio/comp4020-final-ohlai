import { JSDOM } from "jsdom";
import { expect, it } from "vitest";

// Log out asks first (notes/features/logout-conformation): a stray tap on
// Cancel must leave you logged in, and the page must scroll again after.
const dom = new JSDOM(`<!doctype html><body></body>`, { url: "http://app.test/settings" });
const w = dom.window;
// shortcut: jsdom has no showModal, so this fakes the open flag only.
w.HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
w.HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new w.Event("close"));
};
const calls: string[] = [];
Object.assign(globalThis, {
  document: w.document,
  location: w.location,
  fetch: async (path: string) => { calls.push(path); return new Response("{}"); },
});
// @ts-expect-error public/ is plain browser JS with no types
const { logout } = await import("../public/ui.js");
const buttons = () => [...w.document.querySelectorAll<HTMLButtonElement>("dialog.confirm button")];
const locked = () => w.document.documentElement.classList.contains("locked");

it("Log out opens a popup and Cancel keeps you logged in", () => {
  logout();
  expect(w.document.querySelector("dialog.confirm")?.hasAttribute("open")).toBe(true);
  expect(locked()).toBe(true);
  buttons().find((b) => b.textContent === "Cancel")!.click();
  expect(w.document.querySelector("dialog.confirm")).toBeNull();
  expect(locked()).toBe(false);
  expect(calls).toEqual([]);
});

it("confirming in the popup logs you out", async () => {
  logout();
  buttons().find((b) => b.textContent === "Log out")!.click();
  await new Promise((r) => setTimeout(r, 0));
  expect(calls).toEqual(["/api/logout"]);
});
