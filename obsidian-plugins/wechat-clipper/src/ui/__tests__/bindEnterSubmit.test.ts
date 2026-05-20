import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindEnterSubmit } from "../bindEnterSubmit";

beforeEach(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  (globalThis as any).window = dom.window;
  (globalThis as any).document = dom.window.document;
  (globalThis as any).KeyboardEvent = dom.window.KeyboardEvent;
  (globalThis as any).HTMLElement = dom.window.HTMLElement;
});

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).document;
  delete (globalThis as any).KeyboardEvent;
  delete (globalThis as any).HTMLElement;
});

describe("bindEnterSubmit", () => {
  it("calls onSubmit and prevents default when pressing Enter", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    const onSubmit = vi.fn();
    bindEnterSubmit(input, onSubmit);

    const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    const ok = input.dispatchEvent(ev);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(ok).toBe(false);
  });

  it("does not call onSubmit when pressing Shift+Enter", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    const onSubmit = vi.fn();
    bindEnterSubmit(input, onSubmit);

    const ev = new KeyboardEvent("keydown", {
      key: "Enter",
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    const ok = input.dispatchEvent(ev);

    expect(onSubmit).toHaveBeenCalledTimes(0);
    expect(ok).toBe(true);
  });

  it("does not call onSubmit when composing", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    const onSubmit = vi.fn();
    bindEnterSubmit(input, onSubmit);

    const ev = new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true
    });
    input.dispatchEvent(ev);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it("can unbind listener", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);

    const onSubmit = vi.fn();
    const unbind = bindEnterSubmit(input, onSubmit);
    unbind();

    const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    input.dispatchEvent(ev);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });
});
