import { describe, expect, it } from "vitest";
import { projectProgress, type ProgressInput } from "@/lib/project-progress";

const NOW = Date.parse("2026-10-26T12:00:00Z");
const basics = { businessName: "Healthy Box", offering: "Meal boxes", targetCustomers: "Office workers", revenueModel: "Subscription" };

const base = (over: Partial<ProgressInput> = {}): ProgressInput => ({
  profile: {},
  analyses: [],
  links: [],
  conclusion: "",
  summaryUpdatedAt: null,
  publications: [],
  lastFieldEditAt: null,
  now: NOW,
  ...over,
});

describe("project progress", () => {
  it("starts with the business profile", () => {
    const p = projectProgress(base({ profile: { businessName: "Healthy Box" } }));
    expect(p.profile).toEqual({ filled: 1, total: 9, done: false });
    expect(p.next).toBe("profile");
  });

  it("counts the profile done once the four basics are filled", () => {
    const p = projectProgress(base({ profile: basics }));
    expect(p.profile.done).toBe(true);
    expect(p.next).toBe("frameworks");
    expect(p.frameworks).toEqual({ total: 0, done: 0, firstOpen: null, complete: false });
  });

  it("points at the first framework not marked done", () => {
    const p = projectProgress(
      base({
        profile: basics,
        analyses: [
          { id: "a", status: "done" },
          { id: "b", status: "in_progress" },
          { id: "c", status: "not_started" },
        ],
      }),
    );
    expect(p.frameworks).toEqual({ total: 3, done: 1, firstOpen: "b", complete: false });
    expect(p.next).toBe("frameworks");
  });

  it("never suggests the optional client step", () => {
    const p = projectProgress(base({ profile: basics, analyses: [{ id: "a", status: "done" }] }));
    expect(p.client).toEqual({ active: 0, opened: 0, submitted: 0 });
    expect(p.next).toBe("summary");
  });

  it("counts only live links as active", () => {
    const p = projectProgress(
      base({
        links: [
          { revoked_at: null, expires_at: null, opened_at: "2026-10-25T00:00:00Z", submitted_at: null },
          { revoked_at: "2026-10-24T00:00:00Z", expires_at: null, opened_at: null, submitted_at: null },
          { revoked_at: null, expires_at: "2026-10-01T00:00:00Z", opened_at: null, submitted_at: "2026-09-30T00:00:00Z" },
        ],
      }),
    );
    expect(p.client).toEqual({ active: 1, opened: 1, submitted: 1 });
  });

  it("moves to the report once the summary has a conclusion", () => {
    const p = projectProgress(base({ profile: basics, analyses: [{ id: "a", status: "done" }], conclusion: "Focus on retention" }));
    expect(p.summary.done).toBe(true);
    expect(p.next).toBe("report");
  });

  it("finishes when the latest live report is newer than every edit", () => {
    const p = projectProgress(
      base({
        profile: basics,
        analyses: [{ id: "a", status: "done" }],
        conclusion: "Focus on retention",
        summaryUpdatedAt: "2026-10-26T09:00:00Z",
        lastFieldEditAt: "2026-10-26T08:00:00Z",
        publications: [
          { published_at: "2026-10-26T10:00:00Z", revoked_at: null },
          { published_at: "2026-10-26T11:00:00Z", revoked_at: "2026-10-26T11:30:00Z" },
        ],
      }),
    );
    expect(p.report).toEqual({ publishedAt: "2026-10-26T10:00:00Z", outdated: false, done: true });
    expect(p.next).toBeNull();
  });

  it("flags the report when fields change after publishing", () => {
    const p = projectProgress(
      base({
        profile: basics,
        analyses: [{ id: "a", status: "done" }],
        conclusion: "Focus on retention",
        lastFieldEditAt: "2026-10-26T11:00:00Z",
        publications: [{ published_at: "2026-10-26T10:00:00Z", revoked_at: null }],
      }),
    );
    expect(p.report.outdated).toBe(true);
    expect(p.next).toBe("report");
  });
});
