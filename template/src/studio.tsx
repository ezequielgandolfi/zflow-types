import { useQuery } from '@tanstack/react-query';
import { defineStudioPlugin, studioHost } from '@zflow/studio-sdk';
import { useState } from 'react';
import { greet, type GreetingStyle } from './greeting.ts';

function HelloPage() {
  const { Page, Field, Link } = studioHost();
  const [name, setName] = useState('');
  const [style, setStyle] = useState<GreetingStyle>('friendly');
  // Runs on the Studio's own QueryClient, since react-query is shared with the Studio.
  const projects = useQuery({
    queryKey: ['hello', 'projects'],
    queryFn: async () => (await fetch('/api/projects')).json() as Promise<unknown[]>,
  });

  return (
    <Page
      title="Hello"
      subtitle={
        <>
          The Greet step builds a greeting for a name. Try it here, then add it to an automation in{' '}
          {projects.data?.length === 1 ? 'your project' : 'one of your projects'}:{' '}
          <Link to="/projects">open projects</Link>.
        </>
      }
    >
      <div className="card">
        <div className="settings-form">
          <Field label="Name" hint="Who the greeting is for">
            {(id) => <input id={id} className="input" value={name} onChange={(event) => setName(event.target.value)} />}
          </Field>
          <Field label="Style">
            {(id) => (
              <select
                id={id}
                className="input"
                value={style}
                onChange={(event) => setStyle(event.target.value as GreetingStyle)}
              >
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
              </select>
            )}
          </Field>
        </div>
        <p aria-live="polite">
          <strong>{greet(name, style)}</strong>
        </p>
      </div>
    </Page>
  );
}

export default defineStudioPlugin({
  id: 'hello',
  navEntries: [
    {
      id: 'hello',
      label: 'Hello',
      description: 'Tries out the greeting styles of the Greet step',
      icon: 'hand',
      path: '/hello',
      order: 50,
    },
  ],
  routes: [{ path: '/hello', Component: HelloPage }],
});
