/* eslint-disable no-useless-escape */

import { promises as fs } from 'node:fs';

let indexDTS = await fs.readFile('./dist/index.d.ts', 'utf-8');

function stripZodObject(str: string) {
  const lines = [];
  let open = false;
  const skip = str.match(/^\s{8}}, \{/gm)?.length ?? 0;
  let i = 1;
  for (const line of str.split('\n')) {
    if (line.match(/^\s{8}}, \{/)) {
      if (i < skip) {
        i++;
        continue;
      }
      open = true;
      lines.push(' '.repeat(8) + '{');
    } else if (line.match(/^\s{8}}>;/)) {
      open = false;
      lines.push(' '.repeat(8) + '}');
    } else if (open) {
      lines.push(line);
    }
  }
  return lines.join('\n');
}

const COMMAND_FN_REGEX = /: CommandFn<([\n\s\w\d{}\[\]|?:.,;<>"_]+), false|true>;/gm;
for (const match of indexDTS.matchAll(COMMAND_FN_REGEX)) {
  const fn = match[1];
  // Line by line
  const lines = fn.split('\n');
  const params = [];
  let a = [];
  let open = false;
  for (const line of lines) {
    if (line.match(/^\s{8}\w+: z.ZodObject</)) {
      open = true;
    }
    if (open) {
      a.push(line);
    }
    if (line.match(/^\s{8}}>;/)) {
      open = false;
      params.push(a.join('\n'));
      a = [];
    }
  }

  for (const param of params) {
    const name = param.split('\n').at(0)?.match(/\w+/)?.[0];
    const pureObject = stripZodObject(param.replace(/\s{8}\w+:/, '')).replace(
      /\s{8}\{/,
      `${' '.repeat(8)}${name}: {`
    );

    indexDTS = indexDTS.replace(param, pureObject);
  }
}

await fs.writeFile('./dist/index.d.ts', indexDTS, 'utf-8');
