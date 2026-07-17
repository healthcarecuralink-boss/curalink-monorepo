// Edge Functions have no built-in CORS handling -- functions invoked directly
// from browser JS (via supabase.functions.invoke) need these on every
// response, including the preflight OPTIONS request, or the browser blocks
// the call before it ever reaches the function. Native RN fetch doesn't
// enforce CORS, so this only ever bites on the web target.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
