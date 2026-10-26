import { describe, expect, it } from "vitest";
import { CONCLUSION, list, listItems, moveItem, NEXT, SOURCES, toItems } from "@/frameworks/helpers";
import { fieldOrder, fieldsOf, FRAMEWORKS, getFramework, nextEmptyField } from "@/frameworks/registry";

const CLOSING = [SOURCES, CONCLUSION, NEXT];

describe("list items", () => {
  it("reads old string lists and new item lists the same way", () => {
    const data = {
      old: ["a", "", "b"],
      next: [{ id: "x", text: "a", tag: "blue" }, { id: "y", text: " b " }, { id: "z", text: "" }],
    };
    expect(list(data, "old")).toEqual(["a", "b"]);
    expect(list(data, "next")).toEqual(["a", "b"]);
    expect(listItems(data, "old").map((i) => i.id)).toEqual(["old-0", "old-1", "old-2"]);
    expect(listItems(data, "next")[0]).toEqual({ id: "x", text: "a", tag: "blue" });
  });

  it("drops unknown colors and junk entries", () => {
    expect(toItems([{ id: "a", text: "x", tag: "plaid" }, 3, null])).toEqual([{ id: "a", text: "x" }]);
  });

  it("moves an item to another list at a position", () => {
    const data = { a: [{ id: "1", text: "one" }, { id: "2", text: "two" }], b: [{ id: "3", text: "three" }] };
    const patch = moveItem(data, { field: "a", id: "1" }, { field: "b", index: 0 });
    expect(list(patch, "a")).toEqual(["two"]);
    expect(list(patch, "b")).toEqual(["one", "three"]);
  });

  it("reorders within one list", () => {
    const data = { a: ["x", "y", "z"] };
    const id = listItems(data, "a")[0].id;
    expect(list(moveItem(data, { field: "a", id }, { field: "a", index: 3 }), "a")).toEqual(["y", "z", "x"]);
    expect(list(moveItem(data, { field: "a", id: listItems(data, "a")[2].id }, { field: "a", index: 0 }), "a")).toEqual(["z", "x", "y"]);
  });

  it("appends when the target index is past the end", () => {
    const patch = moveItem({ a: ["x"], b: ["y"] }, { field: "a", id: "a-0" }, { field: "b", index: Number.MAX_SAFE_INTEGER });
    expect(list(patch, "b")).toEqual(["y", "x"]);
  });
});

describe("suggested order", () => {
  it("covers every field once, closing fields last", () => {
    for (const def of FRAMEWORKS) {
      const order = fieldOrder(def);
      expect(new Set(order).size, def.key).toBe(order.length);
      expect(order.slice(-3), def.key).toEqual(CLOSING);
    }
  });

  it("finds the next empty field, wrapping around", () => {
    const def = getFramework("jtbd")!;
    expect(nextEmptyField(def, {})).toBe("customer");
    expect(nextEmptyField(def, { customer: "x" })).toBe("situation");
    expect(nextEmptyField(def, { customer: "x" }, "outcome")).toBe("functional");
    const all = Object.fromEntries(fieldOrder(def).map((k) => [k, k === "interviews" ? 5 : k === "alternatives" || k === SOURCES ? ["x"] : "x"]));
    expect(nextEmptyField(def, all)).toBeNull();
  });
});

describe("grid canvases", () => {
  const grids = FRAMEWORKS.filter((f) => f.canvas);

  it("places every field on the canvas exactly once", () => {
    for (const def of grids) {
      const placed = def.canvas!.boards.flatMap((b) => b.cells.flatMap((c) => c.fields));
      const expected = fieldsOf(def)
        .map((f) => f.key)
        .filter((k) => !CLOSING.includes(k));
      expect([...placed].sort(), def.key).toEqual([...expected].sort());
    }
  });

  it("uses every grid area exactly by a cell", () => {
    for (const def of grids) {
      for (const board of def.canvas!.boards) {
        const areas = new Set(board.areas.join(" ").split(/\s+/));
        expect(new Set(board.cells.map((c) => c.area)), def.key).toEqual(areas);
        for (const row of board.areas) expect(row.split(/\s+/).length, `${def.key} row`).toBe(board.columns);
      }
    }
  });

  it("names a real list field as the link anchor", () => {
    for (const def of grids.filter((d) => d.canvas!.linkAnchor)) {
      expect(fieldsOf(def).find((f) => f.key === def.canvas!.linkAnchor)?.type, def.key).toBe("list");
    }
  });
});
