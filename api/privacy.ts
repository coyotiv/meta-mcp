const handler = async (_req: Request) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy - Meta Ads MCP Server</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a202c; background:#f7fafc; margin:0; }
    .container { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 2rem; }
    h1 { margin: 0 0 1rem; font-size: 1.75rem; }
    h2 { font-size: 1.25rem; margin-top: 1.5rem; }
    p, li { line-height: 1.6; color: #2d3748; }
    ul { padding-left: 1.2rem; }
    .muted { color:#718096; font-size: .9rem; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { margin-top: 1rem; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Privacy Policy</h1>
      <p class="muted">Latest update: October 20, 2025</p>

      <p>This service provides a Model Context Protocol (MCP) server that connects a user’s Meta account to MCP clients (e.g., Claude, Cursor) to manage Facebook/Instagram advertising via the Meta Marketing API. It is deployed at meta-mcp-beryl.vercel.app and intended for business users.</p>

      <h2>Owner and Data Controller</h2>
      <p>
        Coyotiv GmbH<br/>
        c/o Factory Works GmbH<br/>
        Rheinsberger Straße 76/77<br/>
        10115 Berlin, Germany<br/>
        Owner contact email: <a href="mailto:legal@coyotiv.com">legal@coyotiv.com</a>
      </p>

      <h2>Types of Data collected</h2>
      <ul>
        <li>Account and identity from Meta: id, name, email (after user authorization).</li>
        <li>Authentication data: OAuth codes, access/refresh tokens (if applicable), server-issued session token.</li>
        <li>On-demand Meta Ads data: ad accounts, campaigns, ad sets, ads, creatives, audiences, insights. Processed transiently to fulfill requests; not persistently stored server-side.</li>
        <li>Technical/usage data: IP address, user-agent, server diagnostics, timestamps for security and rate limiting.</li>
        <li>Strictly necessary cookies: oauth_state (CSRF), session_token (session).</li>
      </ul>

      <h2>Mode and place of processing</h2>
      <p>Processing uses IT systems with appropriate controls (TLS in transit, restricted access, time-limited tokens/sessions). Authorized personnel may access Data on a need-to-know basis. We use EU-hosted storage (Upstash Redis, Frankfurt) and Vercel for hosting. Where international transfers occur, safeguards such as Standard Contractual Clauses apply with technical and organizational measures.</p>

      <h2>Purposes and legal bases</h2>
      <ul>
        <li><strong>Provide the service</strong>: authenticate users, connect to the Meta Marketing API, and fulfill MCP tool requests. Legal basis: performance of a contract; legitimate interests.</li>
        <li><strong>Security and rate limiting</strong>: protect accounts, prevent abuse, troubleshoot errors. Legal basis: legitimate interests; legal obligations where applicable.</li>
        <li><strong>Compliance</strong>: meet Meta Platform Terms and applicable laws. Legal basis: legal and contractual obligations.</li>
      </ul>

      <h2>Cookies/Trackers</h2>
      <p>Strictly necessary only: <code>oauth_state</code> for CSRF protection and <code>session_token</code> for session management. No analytics or advertising cookies.</p>

      <h2>Retention</h2>
      <ul>
        <li>Sessions: up to 7 days from last activity.</li>
        <li>Meta tokens: up to 60 days (or shorter if revoked/expired).</li>
        <li>Meta Ads data: processed transiently per request; not persistently stored server-side.</li>
        <li>Logs: retained for operational security and troubleshooting per provider defaults/policies, then deleted or anonymized.</li>
      </ul>

      <h2>Sharing and processors</h2>
      <ul>
        <li>Hosting/runtime: Vercel, Inc.</li>
        <li>Storage: Upstash Redis (Frankfurt/EU); Vercel KV may be used if configured.</li>
        <li>Meta Platforms: as directed by the User via authenticated API requests.</li>
      </ul>

      <h2>User rights (GDPR)</h2>
      <p>Subject to law, Users may request access, rectification, update, erasure, restriction or objection; data portability; withdraw consent where applicable; and lodge a complaint with a supervisory authority.</p>

      <h2>How to exercise your rights</h2>
      <ul>
        <li>Self-service endpoints: POST <code>/api/auth/revoke</code> and POST <code>/api/auth/logout</code>.</li>
        <li>Or contact: <a href="mailto:legal@coyotiv.com">legal@coyotiv.com</a>.</li>
      </ul>

      <h2>Data security</h2>
      <p>HTTPS/TLS in transit; HttpOnly session cookies; time-limited sessions and tokens; least-privilege access; EU-region storage; at-rest encryption by providers; operational monitoring.</p>

      <h2>Children’s data</h2>
      <p>The service is intended for business users. We do not knowingly collect data from children. Contact us to request deletion if needed.</p>

      <h2>Relationship to Meta Platform Terms</h2>
      <p>We process Platform Data only as described here, under applicable laws, and in compliance with Meta’s terms and policies. This policy does not supersede or conflict with any terms applicable to Platform Data.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy and will post changes at this URL with an updated date. Where required, we will obtain new consent.</p>

      <p class="muted">Coyotiv GmbH — legal@coyotiv.com</p>

      <a class="back" href="/api/index">← Back to Home</a>
    </div>
  </div>
</body>
</html>
  `;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
};

export { handler as GET };


