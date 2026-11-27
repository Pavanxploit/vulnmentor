import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { GET } from "@/app/api/certificate/route";
import { getStudentSession } from "@/lib/progress-store";
import { challenges } from "@/data/challenges";
import { createEmptyProgress } from "@/lib/progress-types";
import { PDFDocument } from "pdf-lib";

vi.mock("@/lib/progress-store", () => ({ getStudentSession: vi.fn() }));
it("issues a real PDF only after every core lab is complete", async () => {
  const request = new NextRequest("http://localhost/api/certificate");
  vi.mocked(getStudentSession).mockResolvedValue(null);
  expect((await GET(request)).status).toBe(401);
  const progress = createEmptyProgress();
  vi.mocked(getStudentSession).mockResolvedValue({
    progress,
    student: {
      id: "student",
      name: "Demo Student",
      role: "student",
      email: "demo@example.test",
      usn: "",
      createdAt: "",
      lastSeenAt: "",
    },
    session: {
      id: "fixture",
      userId: "student",
      createdAt: "",
      lastSeenAt: "",
      expiresAt: "",
    },
  });
  expect((await GET(request)).status).toBe(403);
  progress.completed = challenges.map((l) => l.id);
  const response = await GET(request);
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(
    (await PDFDocument.load(await response.arrayBuffer())).getPageCount(),
  ).toBe(1);
});
