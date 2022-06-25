import type { LoaderFunction, ActionFunction } from '@remix-run/node';
import { Button, Modal, Select } from 'antd';
import { json } from '@remix-run/node'; // or "@remix-run/cloudflare"
import { useLoaderData, useFetcher } from '@remix-run/react';
import notion from '~/notion';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Calendar, DateLocalizer, momentLocalizer } from 'react-big-calendar';
import { Form, useActionData, useTransition } from '@remix-run/react';
import { userPrefs } from '~/cookies';

const localizer = momentLocalizer(moment);
const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;
type ActionData =
  | {
      work: null | string;
      content: null | string;
      fromId: null | string;
      toId: null | string;
      start: null | string;
      end: null | string;
    }
  | undefined;

export const action: ActionFunction = async ({ request }) => {
  try {
    const cookieHeader = request.headers.get('Cookie');

    const { pages } = (await userPrefs.parse(cookieHeader)) || {};
    const database_id = pages.find((item: any) => item.label === 'TodoList').key || '';

    const formData = await request.formData();

    const work = formData.get('work');
    const content = formData.get('content');
    const fromId = formData.get('fromId');
    const toId = formData.get('toId');
    const start = formData.get('start');
    const end = formData.get('end');
    const updateID = formData.get('updateID');
    console.log({ updateID });

    const errors: ActionData = {
      work: work ? null : 'work is required',
      content: content ? null : 'content is required',
      fromId: fromId ? null : 'from people is required',
      toId: toId ? null : 'to people is required',
      start: start ? null : 'start time is required',
      end: end ? null : 'end time is required',
    };
    const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
    if (hasErrors) {
      return json<ActionData>(errors);
    }

    if (updateID) {
      const response = await notion.pages.update({
        page_id: updateID as string,

        properties: {
          /* @ts-ignore */
          work: { title: [{ text: { content: work } }] },
          /* @ts-ignore */
          status: { select: { name: 'pending' } },
          /* @ts-ignore */
          from: { people: [{ object: 'user', id: fromId }] },
          /* @ts-ignore */
          to: { people: [{ object: 'user', id: toId }] },
          /* @ts-ignore */
          start: { date: { start } },
          /* @ts-ignore */
          end: { date: { start: end } },
          /* @ts-ignore */
          content: { rich_text: [{ text: { content } }] },
        },
      });
      console.log(response);
    } else {
      const response = await notion.pages.create({
        parent: { database_id },

        properties: {
          /* @ts-ignore */
          work: { title: [{ text: { content: work } }] },
          /* @ts-ignore */
          status: { select: { name: 'pending' } },
          /* @ts-ignore */
          from: { people: [{ object: 'user', id: fromId }] },
          /* @ts-ignore */
          to: { people: [{ object: 'user', id: toId }] },
          /* @ts-ignore */
          start: { date: { start } },
          /* @ts-ignore */
          end: { date: { start: end } },
          /* @ts-ignore */
          content: { rich_text: [{ text: { content } }] },
        },
      });
      console.log(response);
    }

    return json({});
  } catch (error) {
    // return json<ActionData>({ title: '', slug: '', markdown: '' });
    return json({});

    // invariant(typeof title === "string", "title must be a string");
    // invariant(typeof slug === "string", "slug must be a string");
    // invariant(typeof markdown === "string", "markdown must be a string");
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const from = url.searchParams.get('from') === 'undefined' ? null : url.searchParams.get('from');
  const to = url.searchParams.get('to') === 'undefined' ? null : url.searchParams.get('to');

  const cookieHeader = request.headers.get('Cookie');

  const { pages, employees } = (await userPrefs.parse(cookieHeader)) || {};
  // console.log(employees);
  const database_id = pages.find((item: any) => item.label === 'TodoList').key || '';

  let and: any[] = [];
  if (from) {
    and.push({
      property: 'from',
      people: { contains: from },
    });
  }
  if (to) {
    and.push({
      property: 'to',
      people: { contains: to },
    });
  }
  console.log(and);

  console.log({ from, to });
  if (database_id) {
    const { results } = await notion.databases.query({
      database_id,

      filter: {
        and,
      },
    });
    // console.log(results);
    return json({
      jobs: results.map((item: any) => {
        return { ...item.properties, id: item.id };
      }),
      employees,
    });
  }

  return json([]);
};

export default function Index({ showDemoLink = true, ...props }) {
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const [defaultValue, setDefaultValue] = React.useState<any>({});

  const showModal = () => {
    setDefaultValue({});
    setIsModalVisible(true);
  };
  const handleCancel = () => setIsModalVisible(false);

  const [from, setFrom] = React.useState<string | null>();
  const [to, setTo] = React.useState<string | null>();
  const fetcher = useFetcher();
  const handleFromChange = (value: any) => {
    setFrom(value);
  };
  const handleToChange = (value: any) => {
    setTo(value);
  };

  const [jobs, setJobs] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetcher.submit({ from: from || '', to: to || '' }, { method: 'get' });
  }, [from, to]);

  React.useEffect(() => {
    console.log(fetcher.data);
    if (fetcher.data) {
      setJobs(fetcher.data?.jobs);
      setEmployees(fetcher.data?.employees);
    }
  }, [fetcher]);

  const tempData = useLoaderData();

  React.useEffect(() => {
    setJobs(tempData.jobs);
    setEmployees(tempData.employees);
  }, [tempData]);

  // const { jobs, employees } = useLoaderData();

  const errors = useActionData();

  const transition = useTransition();
  const isCreating = Boolean(transition.submission);

  React.useEffect(() => {
    if (!isCreating) {
      setIsModalVisible(false);
    }
  }, [isCreating]);

  const myEventsList = jobs.map((item: any) => {
    // console.log(item);
    return {
      id: item.id,
      title: item.work?.title[0]?.text?.content,
      start: moment(item.start?.date?.start).toDate(),
      end: moment(item.end?.date?.start).toDate(),
      allDay: true,
      status: item.status.select.name,
      from: item.from.people[0].id,
      to: item.to.people[0].id,
      content: item.content.rich_text[0].plain_text,
    };
  });

  const handleSelectEvent = React.useCallback((event) => {
    console.log(event);
    setDefaultValue({
      updateID: event.id,
      work: event.title,
      content: event.content,
      fromId: event.from,
      toId: event.to,
      start: event.start,
      end: event.end,
    });
    setIsModalVisible(true);
  }, []);

  return (
    <>
      <div className="flex justify-end">
        <div className="flex content-center">
          由
          <Select style={{ width: 120 }} onChange={handleFromChange} allowClear={true}>
            {employees.map((item: any) => (
              <Select.Option value={item.id} key={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
          發起
        </div>

        <div className="flex content-center ml-3">
          由
          <Select style={{ width: 120 }} onChange={handleToChange} allowClear={true}>
            {employees.map((item: any) => (
              <Select.Option value={item.id} key={item.id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
          接收
        </div>

        <div className="flex-1" />
        <Button type="primary" onClick={showModal}>
          新增Todo
        </Button>
      </div>

      <Calendar
        localizer={localizer}
        events={myEventsList}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        onSelectEvent={handleSelectEvent}
        // onSelectSlot={handleSelectSlot}
      />

      {isModalVisible && (
        <Modal title="工作" visible={isModalVisible} onCancel={handleCancel} footer={null}>
          <Form method="post">
            <p>
              <input
                type="text"
                name="updateID"
                hidden={true}
                defaultValue={defaultValue.updateID}
              />
              <label>
                Work Title: {errors?.work ? <em className="text-red-600">{errors.work}</em> : null}
                <input
                  type="text"
                  name="work"
                  className={inputClassName}
                  defaultValue={defaultValue.work}
                />
              </label>
            </p>
            <p>
              <label>
                Work Content:
                {errors?.content ? <em className="text-red-600">{errors.content}</em> : null}
                <input
                  type="text"
                  name="content"
                  className={inputClassName}
                  defaultValue={defaultValue.content}
                />
              </label>
            </p>
            <p>
              <label>
                From: {errors?.fromId ? <em className="text-red-600">{errors.fromId}</em> : null}
                <select name="fromId" className={inputClassName} defaultValue={defaultValue.fromId}>
                  {employees.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </p>

            <p>
              <label>
                To: {errors?.toId ? <em className="text-red-600">{errors.toId}</em> : null}
                <select name="toId" className={inputClassName} defaultValue={defaultValue.toId}>
                  {employees.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </p>

            <p>
              <label>
                start: {errors?.start ? <em className="text-red-600">{errors.start}</em> : null}
                <input
                  type="date"
                  id="start"
                  name="start"
                  className={inputClassName}
                  defaultValue={moment(defaultValue.start).format('YYYY-MM-DD')}
                />
              </label>
            </p>

            <p>
              <label>
                end: {errors?.end ? <em className="text-red-600">{errors.end}</em> : null}
                <input
                  type="date"
                  id="start"
                  name="end"
                  className={inputClassName}
                  defaultValue={moment(defaultValue.end).format('YYYY-MM-DD')}
                />
              </label>
            </p>

            <p className="text-right mt-2">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
                disabled={isCreating}
              >
                {/* {isCreating ? 'Creating...' : 'Create Post'} */}
                {defaultValue.updateID ? 'Update' : 'Create'}
              </button>
            </p>
          </Form>
        </Modal>
      )}
    </>
  );
}
Index.propTypes = {
  localizer: PropTypes.instanceOf(DateLocalizer),
  showDemoLink: PropTypes.bool,
};
