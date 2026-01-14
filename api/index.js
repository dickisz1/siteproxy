const { Hono } = require('hono');
const { handle } = require('@hono/node-server/vercel');

const app = new Hono().basePath('/api');

// 设置你的暗号 (Token)
const TOKEN_PREFIX = '/my-secret-path/';

app.all(`${TOKEN_PREFIX}:proto/:host/*`, async (c) => {
  const { proto, host } = c.req.param();
  const rest = c.req.path.split(`${TOKEN_PREFIX}${proto}/${host}/`)[1] || '';
  
  // 拼接目标 URL (例如: https://www.google.com/search...)
  const targetUrl = `${proto}://${host}/${rest}${c.req.raw.url.split('?')[1] ? '?' + c.req.raw.url.split('?')[1] : ''}`;

  try {
    // 转发请求
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: c.req.header(),
      body: c.req.method !== 'GET' ? await c.req.arrayBuffer() : undefined
    });

    // 返回目标网站的内容
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (err) {
    return c.text('Proxy Error: ' + err.message, 500);
  }
});

// 默认 404 处理
app.notFound((c) => c.text('Invalid path or token. Please use: /api/my-secret-path/https/www.google.com', 404));

module.exports = handle(app);
