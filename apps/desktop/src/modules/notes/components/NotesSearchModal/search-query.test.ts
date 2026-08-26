import { describe, expect, it } from "vitest";
import { parseSearchQuery } from "./search-query";

describe("parseSearchQuery", () => {
  it("parses plain text without tags", () => {
    expect(parseSearchQuery("daily note")).toEqual({
      ok: true,
      query: { text: "daily note", tags: [] },
    });
  });

  it("parses tags at the beginning", () => {
    expect(parseSearchQuery("#daily #work meeting notes")).toEqual({
      ok: true,
      query: { text: "meeting notes", tags: ["daily", "work"] },
    });
  });

  it("parses tags at the end", () => {
    expect(parseSearchQuery("meeting notes #daily #work")).toEqual({
      ok: true,
      query: { text: "meeting notes", tags: ["daily", "work"] },
    });
  });

  it("rejects interleaved tags", () => {
    expect(parseSearchQuery("meeting #daily notes #work")).toEqual({
      ok: false,
      warning:
        "Put tags together at the beginning or end, like \"#tag #tag2 text\" or \"text #tag #tag2\".",
    });
  });

  it("rejects malformed tag tokens", () => {
    expect(parseSearchQuery("meeting daily#work")).toEqual({
      ok: false,
      warning:
        "Put tags together at the beginning or end, like \"#tag #tag2 text\" or \"text #tag #tag2\".",
    });
  });
});
