import { PrismaClient } from '@prisma/client';
import { PrismaTiDBCloud } from '@tidbcloud/prisma-adapter';
import { connect } from '@tidbcloud/serverless';
import dotenv from 'dotenv';
dotenv.config();

const conn = connect({
  url: process.env.DATABASE_URL_PRODUCTION,
  fetch: async (url, opts) => {
    const res = await globalThis.fetch(url, opts);
    let text = await res.text();
    text = text.replace(/"type":"JSON"/g, '"type":"VARCHAR"');
    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }
});
const adapter = new PrismaTiDBCloud(conn);
const prisma = new PrismaClient({ adapter });

async function main() {
  const q = await prisma.questions.findFirst();
  console.log('Result type for correctAnswer:', typeof q?.correctAnswer);
  console.log('Result:', q?.correctAnswer);
  
  // also test option findFirst
  const o = await prisma.options.findFirst();
  console.log('Result type for optionAimage:', typeof o?.optionAimage);
}
main().catch(console.error).finally(() => prisma.$disconnect());
