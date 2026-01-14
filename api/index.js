const { Hono } = require('hono');
const { handle } = require('@hono/node-server/vercel');

const app = new Hono();

// 你的暗号
const TOKEN_PREFIX = '/my-secret-path/';

// 改进后的路由匹配：支持任意协议、主机名和后续所有路径
app.all(`${TOKEN_PREFIX}:proto/:host/:rest{.+$}`, async (c) => {
  const { proto, host, rest } = c.req.param();
  
  // 构建目标地址
  const url = new URL(c.req.url);
  const targetUrl = `${proto}://${host}/${rest}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: c.req.header(),
      body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.arrayBuffer()
    });

    // 构造返回给浏览器的响应
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*'); // 解决跨域

    return new Response(response.body, {
      status: response.status,
      headers: headers
    });
  } catch (err) {
    return c.text('Proxy Error: ' + err.message, 500);
  }
});

// 当路径不匹配时显示的错误
app.notFound((c) => {
  return c.text('URL 格式不正确。请确认使用了: ' + TOKEN_PREFIX + 'https/www.google.com', 404);
});

module.exports = handle(app);
