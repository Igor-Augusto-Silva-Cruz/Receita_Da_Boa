import app from "./app";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const DOMAINS = process.env.REPLIT_DOMAINS?.split(",") ?? [];
const callbackURL = DOMAINS.length > 0
  ? `https://${DOMAINS[0]}/api/auth/google/callback`
  : `http://localhost:80/api/auth/google/callback`;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Google OAuth callback URL: ${callbackURL}`);
  console.log(`Add this to Google Cloud Console → Authorized redirect URIs`);
});
