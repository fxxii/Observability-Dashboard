import { describe, it, expect } from "bun:test";
import { WsManager } from "./ws";

describe("REQ-5: WsManager", () => {
  it("tracks connected client count", () => {
    const mgr = new WsManager();
    const ws = { send: () => {}, readyState: 1 } as any;
    mgr.add(ws);
    expect(mgr.count()).toBe(1);
    mgr.remove(ws);
    expect(mgr.count()).toBe(0);
  });

  it("broadcasts to all open clients", () => {
    const mgr = new WsManager();
    const received: string[] = [];
    mgr.add({ send: (m: string) => received.push(m), readyState: 1 } as any);
    mgr.broadcast('{"type":"event"}');
    expect(received).toContain('{"type":"event"}');
  });

  it("skips closed clients during broadcast", () => {
    const mgr = new WsManager();
    mgr.add({ send: () => { throw new Error("closed"); }, readyState: 3 } as any);
    expect(() => mgr.broadcast("test")).not.toThrow();
  });
});
