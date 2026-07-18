import * as React from "react";
import * as Sentry from "@sentry/react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({ dsn: DSN, tracesSampleRate: 0.2, sendDefaultPii: false });
}

export const wrapRootLayout = (component: any): any => {
  return DSN ? Sentry.wrap(component) : component;
};

export { Sentry };
