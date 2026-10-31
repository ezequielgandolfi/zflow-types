import { defineComponent, definePlugin } from '@zflow/sdk';
import packageJson from '../package.json' with { type: 'json' };
import { greet, type GreetingStyle } from './greeting.ts';

export const greetStep = defineComponent({
  id: 'hello.greet',
  name: 'Greet',
  description: 'Builds a greeting for a name',
  category: 'Text',
  icon: 'hand',
  inputMode: 'single',
  outputs: [{ name: 'ok' }],
  properties: {
    name: { type: 'string', label: 'Name', required: true },
    style: {
      type: 'enum',
      label: 'Style',
      default: 'friendly',
      options: [
        { value: 'friendly', label: 'Friendly' },
        { value: 'formal', label: 'Formal' },
      ],
    },
    message: { type: 'string', label: 'Greeting', readOnly: true },
  },
  execute(ctx) {
    ctx.set('message', greet(ctx.props.name as string, ctx.props.style as GreetingStyle));
  },
});

export default definePlugin({
  id: 'hello',
  name: 'Hello',
  description: 'An example plugin with a greeting step',
  version: packageJson.version,
  automations: { components: [greetStep] },
  studio: './studio.tsx',
});
