import serverless from 'serverless-http';
import { createApp } from '../../server/src/app.js';

const app = createApp();
const baseHandler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
});

/** Map Netlify function path back to Express /api/* routes. */
function normalizeEvent(event) {
  const e = { ...event };
  let p = e.path || e.rawPath || '';
  const prefix = '/.netlify/functions/api';
  if (p.startsWith(prefix)) {
    const rest = p.slice(prefix.length);
    p = '/api' + (rest.startsWith('/') ? rest : rest ? `/${rest}` : '');
  }
  e.path = p;
  if (e.rawPath !== undefined) e.rawPath = p;
  return e;
}

export const handler = (event, context) => baseHandler(normalizeEvent(event), context);
