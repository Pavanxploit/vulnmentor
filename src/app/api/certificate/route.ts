import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { type NextRequest } from "next/server";
import { challenges } from "@/data/challenges";
import { getSessionId } from "@/lib/session-cookie";
import { getStudentSession } from "@/lib/progress-store";

export async function GET(request: NextRequest) {
  const session = await getStudentSession(getSessionId(request));
  if (!session)
    return Response.json(
      { message: "Sign in to view your certificate." },
      { status: 401 },
    );
  if (!challenges.every((lab) => session.progress.completed.includes(lab.id))) {
    return Response.json(
      { message: "Complete all core labs to earn a certificate." },
      { status: 403 },
    );
  }
  const doc = await PDFDocument.create();
  doc.setTitle("VulnMentor Certificate of Completion");
  doc.setAuthor("VulnMentor");
  doc.setSubject("Issued to " + session.student.name);
  const page = doc.addPage([720, 480]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const label = (s: string, y: number, size: number) => {
    page.drawText(s, {
      x: 48,
      y,
      font,
      size: Math.min(
        size,
        (size * 624) / Math.max(1, font.widthOfTextAtSize(s, size)),
      ),
      color: rgb(0.04, 0.17, 0.22),
    });
  };
  label("VULNMENTOR ACADEMY", 400, 15);
  label("Certificate of Completion", 320, 41);
  // Preserve the full name in PDF metadata. Select a printable account identifier for standard PDF fonts.
  const printable = (s: string) =>
    [...s].every((c) => font.getCharacterSet().includes(c.codePointAt(0)!));
  label(
    [session.student.name, session.student.email, session.student.id].find(
      printable,
    )!,
    225,
    30,
  );
  label("Completed the Web and API Security lab curriculum", 175, 19);
  label(challenges.length + " core labs verified by the portal", 135, 16);
  label("Issued " + new Date().toISOString().slice(0, 10), 62, 14);
  return new Response(Buffer.from(await doc.save()), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition":
        'attachment; filename="VulnMentor-certificate.pdf"',
      "cache-control": "private, no-store",
    },
  });
}
