import pg from "pg";
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  const profileRes = await client.query(`select id from public.profiles limit 1`);
  const profileId = profileRes.rows[0].id;
  console.log("Using profile:", profileId);

  // Insert a throwaway device token (bogus value -- FCM will reject it, but
  // that's fine: we're verifying the auth chain + request reach FCM, not
  // that a real device receives anything).
  await client.query(
    `insert into public.push_tokens (profile_id, token, platform) values ($1, $2, 'web') on conflict do nothing`,
    [profileId, "verification-test-token-" + Date.now()],
  );

  const notifRes = await client.query(
    `insert into public.notifications (profile_id, type, title, body, data) values ($1, 'promotion', 'Verification test', 'Testing real FCM wiring', '{}') returning id, created_at`,
    [profileId],
  );
  console.log("Notification inserted:", notifRes.rows[0]);

  // pg_net dispatches async; give it a moment.
  await new Promise((r) => setTimeout(r, 4000));

  const respRes = await client.query(
    `select id, status_code, content, created
     from net._http_response
     order by created desc
     limit 3`,
  );
  console.log("Recent net._http_response rows:", respRes.rows);
} catch (err) {
  console.error("ERROR:", err.message);
} finally {
  // Cleanup: remove the test token + notification we created.
  await client.query(`delete from public.push_tokens where token like 'verification-test-token-%'`);
  await client.query(`delete from public.notifications where title = 'Verification test'`);
  await client.end();
}
