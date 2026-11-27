"use client";
import { useState } from "react";

// Evaluate a declarative response schema against a synthetic record. No learner code is executed.
export function ResponsePatch() {
  const [schema, setSchema] = useState('["displayName", "staffNote"]');
  const [result, setResult] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  async function unlock() {
    setBusy(true);
    try {
      const response = await fetch("/api/defender/chain", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        setResult("");
      } else setResult(data.message);
    } catch {
      setResult("Could not open the follow-up case.");
    } finally {
      setBusy(false);
    }
  }
  async function check() {
    let fields;
    try {
      fields = JSON.parse(schema);
    } catch {
      setResult("Enter a JSON array of field names.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/defender/chain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, fields }),
      });
      const data = await response.json();
      setResult(
        [data.projected && JSON.stringify(data.projected), data.message]
          .filter(Boolean)
          .join(" · "),
      );
    } catch {
      setResult("Could not reach the regression checker.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-lg border border-emerald-300/30 p-5">
      <h2 className="text-xl font-semibold">Fix the student response</h2>
      <p>
        The public profile contract permits only the display name. Patch the
        field list and rerun the regression fixture.
      </p>
      {!token ? (
        <button
          disabled={busy}
          className="rounded bg-cyan-200 p-2 text-slate-950"
          onClick={unlock}
        >
          Unlock follow-up case
        </button>
      ) : (
        <>
          <label className="block">
            Response fields
            <input
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="block w-full bg-slate-800 p-2 font-mono"
            />
          </label>
          <button
            className="rounded bg-cyan-200 p-2 text-slate-950"
            disabled={busy}
            onClick={check}
          >
            Run regression check
          </button>
        </>
      )}
      <p role="status">{result}</p>
    </section>
  );
}
