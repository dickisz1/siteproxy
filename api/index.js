const { Hono } = require('hono');
const { handle } = require('@hono/node-server/vercel');

const app = new Hono();

// 定义你的暗号路径
const TOKEN_PREFIX = '/my-secret-path/';

// 使用 {.+$} 正则确保捕获主机名之后的所有路径（包括斜杠）
app.all(`${TOKEN_PREFIX}:proto/:host/:rest{.+$}`, async (c) => {
  const { proto, host, rest } = c.req.param();
  
  // 拼接完整的目标 URL
  const query = c.req.raw.url.split('?')[1];
  const targetUrl = `${proto}://${host}/${rest}${query ? '?' + query : ''}`;

  try {
    // 转发请求到目标网站
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: c.req.header(),
      // 转发非 GET/HEAD 请求的 Body 数据
      body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.arrayBuffer()
    });

    // 构造响应并处理跨域
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: headers
    });
  } catch (err) {
    return c.text('代理错误: ' + err.message, 500);
  }
});

// 当路径完全不匹配时（例如暗号输入错误），返回此提示
app.notFound((c) => {
  return c.text('URL 格式不正确。请确认使用了完整路径，例如: ' + TOKEN_PREFIX + 'https/www.google.com', 404);
});

module.exports = handle(app);
