import { describe, expect, it } from "vitest";
import { withoutLinksForStrangers } from "../src/creative/eventPrivacy";

const entry = (mine: boolean, youGo: boolean) => ({ event: { id: "h-abc123", link: "https://meet.example.com/x" }, hostName: "A", going: 1, mine, youGo });

describe("the shared events feed", () => {
  it("blanks the video link for people who are neither host nor going", () => {
    expect(withoutLinksForStrangers([entry(false, false)])[0].event.link).toBe("");
  });
  it("keeps it for the host and for people who are going", () => {
    expect(withoutLinksForStrangers([entry(true, false)])[0].event.link).toBe("https://meet.example.com/x");
    expect(withoutLinksForStrangers([entry(false, true)])[0].event.link).toBe("https://meet.example.com/x");
  });
  it("leaves everything else on the event alone and does not change its input", () => {
    const input = [entry(false, false)];
    const out = withoutLinksForStrangers(input);
    expect(out[0].event.id).toBe("h-abc123");
    expect(out[0].going).toBe(1);
    expect(input[0].event.link).toBe("https://meet.example.com/x");
  });
});
