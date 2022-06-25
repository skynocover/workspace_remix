import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node'; // or "@remix-run/cloudflare"
import { useLoaderData, Outlet } from '@remix-run/react';

import { str2uuid } from '../utils/utils';

import { Layout, Menu } from 'antd';
import notion from '~/notion';
import { Link } from '@remix-run/react';
import { userPrefs } from '~/cookies';

const { Header, Content, Sider } = Layout;

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get('Cookie');
  const root = str2uuid(process.env.ROOT_PAGE_ID || '');

  const resp = await notion.blocks.children.list({ block_id: root });

  let pages: any[] = [];
  let employees: any[] = [];

  const temp = resp.results.map(async (item: any) => {
    if (item.child_database) {
      if (item.child_database.title === 'Employee') {
        pages.push({
          key: item.id,
          label: 'Employee',
        });

        const resp = await notion.databases.query({ database_id: item.id });

        employees = resp.results.map((item: any) => {
          return {
            id: item.properties.user.people[0].id || 'id',
            name: item.properties.name.title[0].text.content || 'content',
          };
        });
      } else if (item.child_database.title === 'TodoList') {
        pages.push({
          key: item.id,
          label: 'TodoList',
        });
      }
    }
    return {};
  });

  await Promise.all(temp);

  const cookie = (await userPrefs.parse(cookieHeader)) || { pages, employees };

  return json(pages, { headers: { 'Set-Cookie': await userPrefs.serialize(cookie) } });
};

export default function Index() {
  const pages = useLoaderData();

  return (
    <>
      <Layout style={{ height: '100%' }}>
        <Header className="header">
          <div className="logo" />
        </Header>
        <Layout>
          <Sider width={200} className="site-layout-background">
            <Menu style={{ height: '100%', borderRight: 0 }}>
              {pages.map((item: any) => (
                <Menu.Item key={item.key}>
                  <Link to={item.label}>{item.label}</Link>
                </Menu.Item>
              ))}
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content
              className="site-layout-background"
              style={{
                padding: 24,
                margin: 0,
                minHeight: 280,
              }}
            >
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  );
}
