import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      beforeSend(event) {
        delete event.request;
        delete event.user;
        delete event.breadcrumbs;
        return event;
      },
    });
  }
}
export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    await Sentry.captureRequestError(...args);
  }
};
