import { Client } from '@notionhq/client';

// https://www.notion.so/my-integrations
export default new Client({ auth: process.env.NOTION_API_KEY });
