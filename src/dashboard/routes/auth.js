import express from 'express';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export function createAuthRouter() {
  const router = express.Router();

  const REDIRECT_URI = `${env.DASHBOARD_BASE_URL}/auth/callback`;

  router.get('/login', (req, res) => {
    if (!env.DISCORD_CLIENT_SECRET) {
      return res.status(500).send('DISCORD_CLIENT_SECRET belum dikonfigurasi di file .env');
    }

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=identify%20guilds`;

    res.redirect(discordAuthUrl);
  });

  router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.redirect('/');
    }

    try {
      // Exchange code for token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code.toString(),
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error({ error: errorText }, 'OAuth2 Token Exchange Failed');
        return res.redirect('/?error=oauth_failed');
      }

      const tokenData = await tokenResponse.json();

      // Fetch user profile
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userResponse.json();

      // Fetch user guilds
      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const guildsData = await guildsResponse.json();

      req.session.user = userData;
      req.session.guilds = Array.isArray(guildsData) ? guildsData : [];

      req.session.save((err) => {
        if (err) {
          logger.error({ error: err.message }, 'Failed to save session cookie');
          return res.redirect('/?error=session_error');
        }
        res.redirect('/guilds');
      });
    } catch (err) {
      logger.error({ error: err.message }, 'OAuth callback handling exception');
      res.redirect('/?error=internal_error');
    }
  });

  router.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });

  return router;
}
