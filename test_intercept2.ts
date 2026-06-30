import { connect } from '@tidbcloud/serverless';
import dotenv from 'dotenv';
dotenv.config();

const conn = connect({
  url: process.env.DATABASE_URL_PRODUCTION,
  fetch: async (url, opts) => {
    const res = await globalThis.fetch(url, opts);
    let text = await res.text();
    text = text.replace(/"type":"JSON"/g, '"type":"VARCHAR"');
    console.log('Intercepted Response body:', text);
    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }
});

conn.execute('SELECT JSON_OBJECT("a", 1) as my_json')
  .then(r => console.log('Result:', JSON.stringify(r)))
  .catch(e => console.error(e));
