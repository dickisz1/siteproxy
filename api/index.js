const { Hono } = require('hono');
const { handle } = require('@hono/node-server/vercel');

// 注意：不要在这里设置 basePath，除非你确定所有流量都带前缀
const app = new Hono();

const TOKEN_PREFIX = '/my-secret-path/';

// 核心逻辑：捕获路径中的协议、主机名和剩余部分
app.all(`${TOKEN_PREFIX}:proto/:host/:rest{.+$}`, async (c) => {
  const { proto, host, rest } = c.req.param();
  const targetUrl = `${proto}://${host}/${rest}${c.req.raw.url.split('?')[1] ? '?' + c.req.raw.url.split('?')[1] : ''}`;

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: c.req.header(),
      // 转发 Body 数据（如 POST 请求）
      body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.arrayBuffer()
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });
  } catch (err) {
    return c.text('Proxy Error: ' + err.message, 500);
  }
});

// 你截图中看到的 404 文字就是从这里发出的
app.notFound((c) => c.text('Invalid path or token. Please check your URL structure.', 404));

module.exports = handle(app);
