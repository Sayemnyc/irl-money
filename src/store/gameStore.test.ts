import { describe, expect, it } from "vitest";
import { useGame } from "./gameStore";
import { openRoom, type RoomMessage } from "@/classroom/room";

describe("store ↔ classroom", () => {
  it("a plot twist the student already lived through is ignored", () => {
    useGame.getState().start("Sam", 0);
    const g = useGame.getState().game!;
    useGame.setState({ game: { ...g, seen: [...g.seen, "phone_repair"] } });
    const before = useGame.getState().game!;
    useGame.getState().twist("phone_repair");
    expect(useGame.getState().game).toBe(before);
  });

  it("a fresh plot twist lands", () => {
    useGame.getState().start("Sam", 0);
    useGame.getState().twist("phone_repair");
    expect(useGame.getState().game!.queue.filter((q) => q.scenario === "phone_repair")).toHaveLength(1);
  });

  it("room messages carry a stable student id, and a pause reply after hello pauses the student", async () => {
    const teacher = openRoom("TEST-1");
    const got: RoomMessage[] = [];
    teacher.subscribe((m) => { got.push(m); if (m.type === "hello") teacher.send({ type: "pause", paused: true }); });
    useGame.setState({ name: "Alex", paused: false });
    useGame.getState().joinRoom("TEST-1");
    await new Promise((r) => setTimeout(r, 50));
    const hello = got.find((m) => m.type === "hello");
    expect(hello && "id" in hello && hello.id).toBe(useGame.getState().studentId);
    expect(useGame.getState().paused).toBe(true);
    useGame.getState().joinRoom(null);
    teacher.close();
  });
});
