import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meta Ads MCP Server</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }

        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #1877f2, #42a5f5);
            border-radius: 12px;
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }

        h1 {
            color: #1a202c;
            margin-bottom: 0.5rem;
            font-size: 1.8rem;
        }

        .subtitle {
            color: #718096;
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }

        .features {
            text-align: left;
            margin: 2rem 0;
            background: #f7fafc;
            padding: 1.5rem;
            border-radius: 8px;
        }

        .features h3 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }

        .features ul {
            list-style: none;
        }

        .features li {
            padding: 0.5rem 0;
            display: flex;
            align-items: center;
            color: #4a5568;
            font-size: 0.9rem;
        }

        .features li::before {
            content: "✓";
            color: #48bb78;
            font-weight: bold;
            margin-right: 0.5rem;
        }

        .setup-preview {
            text-align: left;
            margin: 2rem 0;
            background: #f0fff4;
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid #9ae6b4;
        }

        .setup-preview h3 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }

        .setup-preview ol {
            counter-reset: step-counter;
            list-style: none;
            padding-left: 0;
        }

        .setup-preview li {
            padding: 0.5rem 0;
            padding-left: 2rem;
            position: relative;
            color: #2d3748;
            font-size: 0.9rem;
        }

        .setup-preview li::before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            left: 0;
            top: 0.5rem;
            background: #48bb78;
            color: white;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
        }

        .login-btn {
            background: #1877f2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
            margin: 1rem 0;
        }

        .login-btn:hover {
            background: #166fe5;
            transform: translateY(-1px);
        }

        .security-note {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 6px;
            padding: 1rem;
            margin: 1.5rem 0;
            text-align: left;
            font-size: 0.85rem;
            color: #742a2a;
        }

        .security-note strong {
            color: #c53030;
        }

        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 0.8rem;
        }

        .loading {
            display: none;
            color: #718096;
            font-style: italic;
        }

        @media (max-width: 480px) {
            .container {
                padding: 1.5rem;
                margin: 1rem;
            }

            h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">M</div>
        <h1>Meta Ads MCP Server</h1>
        <p class="subtitle">Secure multi-user access to Meta Marketing API via Model Context Protocol</p>

        <div class="features">
            <h3>🔗 What You'll Get After Connecting</h3>
            <ul>
                <li>Campaign Management & Analytics</li>
                <li>Audience Creation & Targeting</li>
                <li>Creative Testing & Optimization</li>
                <li>Real-time Performance Insights</li>
                <li>Automated Reporting & Exports</li>
                <li>Ready-to-use MCP configuration for Claude Desktop</li>
            </ul>
        </div>

        <div class="setup-preview">
            <h3>🛠️ Simple Setup Process</h3>
            <ol>
                <li>Connect your Meta account (secure OAuth)</li>
                <li>Copy the generated MCP configuration</li>
                <li>Add it to your Claude Desktop settings</li>
                <li>Start managing your ads with AI!</li>
            </ol>
        </div>

        <div class="security-note">
            <strong>🔒 Your Security Matters</strong><br>
            Each user authenticates with their own Meta account. Your tokens are stored securely and never shared. You maintain full control over your Facebook Ads data and spending.
        </div>

        <button class="login-btn" onclick="startLogin()">
            Connect Your Meta Account
        </button>

        <div class="loading" id="loading">
            Redirecting to Meta for authentication...
        </div>

        <div class="footer">
            <p>Compatible with Claude Desktop, Cursor IDE, and other MCP clients</p>
            <p>Powered by OAuth 2.1 + Vercel + Meta Marketing API v23.0</p>
            <p><a href="/api/privacy" style="color:#2563eb; text-decoration:none;">Privacy Policy</a></p>
        </div>
    </div>

    <script>
        async function startLogin() {
            const btn = document.querySelector('.login-btn');
            const loading = document.getElementById('loading');

            btn.style.display = 'none';
            loading.style.display = 'block';

            try {
                const response = await fetch('/api/auth/login');
                const data = await response.json();

                if (data.success) {
                    window.location.href = data.authUrl;
                } else {
                    alert('Login failed: ' + data.message);
                    btn.style.display = 'inline-block';
                    loading.style.display = 'none';
                }
            } catch (error) {
                alert('Network error: ' + error.message);
                btn.style.display = 'inline-block';
                loading.style.display = 'none';
            }
        }

        // Check if user is already logged in
        async function checkAuth() {
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('sessionToken')
                    }
                });

                if (response.ok) {
                    window.location.href = '/api/dashboard';
                }
            } catch (error) {
                // User not logged in, show login page
            }
        }

        checkAuth();
    </script>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
