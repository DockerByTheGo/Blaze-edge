import { OrderedRecord } from "../../../src/utils/better-standard-library/RecordCompatibeArray";

type Item = {
  key: "a" | "b";
  value: number;
};

describe("orderedRecord", () => {
  let record: OrderedRecord<"a" | "b", Item>;

  beforeEach(() => {
    record = new OrderedRecord([
      { key: "a", value: 10 },
      { key: "b", value: 20 },
    ]);
  });

  it("should retrieve an element by key", () => {
    expect(record.get("a").unpack()).toEqual({ key: "a", value: 10 });
    expect(record.get("b").unpack()).toEqual({ key: "b", value: 20 });
  });

  it("should return None if key does not exist", () => {
    expect(record.get("c").is_none()).toBe(true);
  });

  it("should get index of key", () => {
    expect(record.getIndexOfKey("a")).toBe(0);
    expect(record.getIndexOfKey("b")).toBe(1);
    expect(record.getIndexOfKey("c")).toBeUndefined();
  });

  it("should update an existing element", () => {
    record.set({ key: "a", value: 99 });
    expect(record.get("a").unpack()).toEqual({ key: "a", value: 99 });
  });

  it("should not update a non-existent key", () => {
    record.set({ key: "c", value: 50 } as any);
    expect(record.get("c").is_none()).toBe(true);
  });

  it("should add a new element at the end", () => {
    const newRecord = record.add({ key: "c", value: 30 });
    expect(newRecord.get("c").unpack()).toEqual({ key: "c", value: 30 });
    expect(newRecord.getIndexOfKey("c")).toBe(2);
  });

  it("should add a new element at a specific position", () => {
    const newRecord = record.add({ key: "c", value: 30 }, 1);
    expect(newRecord.get("c").unpack()).toEqual({ key: "c", value: 30 });
    expect(newRecord.getIndexOfKey("c")).toBe(1);
    expect(newRecord.getIndexOfKey("b")).toBe(2);
  });

  it("should not allow adding duplicate keys", () => {
    // TypeScript should catch this error at compile-time.
    // But we also want to ensure it fails at runtime.
    expect(() => {
      record.add({ key: "a", value: 50 });
    }).toThrow();
  });

  it("should place a new element before the given key", () => {
    const newRecord = record.placeBefore("b", { key: "c", value: 15 });
    expect(newRecord.getIndexOfKey("c")).toBe(1);
    expect(newRecord.getIndexOfKey("b")).toBe(2);
  });

  it("should place a new element after the given key", () => {
    const newRecord = record.placeAfter("a", { key: "c", value: 15 });
    expect(newRecord.getIndexOfKey("c")).toBe(1);
    expect(newRecord.getIndexOfKey("b")).toBe(2);
  });

  it("should not place before a non-existent key", () => {
    expect(() => record.placeBefore("c", { key: "d", value: 25 })).toThrow();
  });

  it("should not place after a non-existent key", () => {
    expect(() => record.placeAfter("c", { key: "d", value: 25 })).toThrow();
  });

  it("should maintain order correctly when placing multiple elements", () => {
    const newRecord = record.placeBefore("b", { key: "c", value: 15 });
    const newNewRecord = newRecord.placeAfter("c", { key: "d", value: 17 });

    expect(newNewRecord.getIndexOfKey("a")).toBe(0);
    expect(newNewRecord.getIndexOfKey("c")).toBe(1);
    expect(newNewRecord.getIndexOfKey("d")).toBe(2);
    expect(newNewRecord.getIndexOfKey("b")).toBe(3);
  });
});
