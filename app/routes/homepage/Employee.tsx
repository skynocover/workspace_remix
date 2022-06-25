import type { LoaderFunction } from '@remix-run/node';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import React from 'react';
import { json } from '@remix-run/node';
import notion from '~/notion';
import { useLoaderData } from '@remix-run/react';
import { userPrefs } from '~/cookies';

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get('Cookie');

  const { pages } = (await userPrefs.parse(cookieHeader)) || {};
  const database_id = pages.find((item: any) => item.label === 'Employee').key || '';

  const resp = await notion.databases.query({
    database_id,
    // filter: username ? { property: 'name', title: { contains: username } } : undefined,
  });

  const result = resp.results.map((item: any) => {
    return {
      id: item.properties.user.people[0].id,
      // email: item.properties.user.people[0].person.email,
      name: item.properties.name.title[0].text.content,
    };
  });

  console.table(result);

  return json(result);
};

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const columns: ColumnsType<DataType> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
];

export default function Index() {
  const data = useLoaderData();
  return <Table columns={columns} dataSource={data} />;
}
