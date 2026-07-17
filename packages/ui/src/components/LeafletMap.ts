// Type-checking shim only. Metro resolves the bare "./LeafletMap" specifier
// to LeafletMap.web.tsx or LeafletMap.native.tsx per-platform automatically
// (standard RN/Expo file-extension resolution, no config needed) and always
// prefers those over this file at bundle time. tsc has no such platform
// awareness, so it needs one concrete, explicit file to check against --
// the web variant, since that's the one this project can actually test
// (Expo web + Playwright; no native simulators available).
export * from "./LeafletMap.web";
