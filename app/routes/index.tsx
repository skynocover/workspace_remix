import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node'; // or "@remix-run/cloudflare"
import { useLoaderData, Outlet } from '@remix-run/react';

import { str2uuid } from '../utils/utils';

import { Layout, Menu } from 'antd';
import notion from '~/notion';
import { Link } from '@remix-run/react';

const { Header, Content, Sider } = Layout;

export const loader: LoaderFunction = async () => {
  return redirect('/homepage');
};

export default function Index() {
  useLoaderData();

  return <></>;
}
