#!/usr/bin/env node
/**
 * rewrite-pnpx.ts - Antigravity PreToolUse hook for rewriting `pnpx` to `pnpm dlx`
 *
 * Intercepts `run_command` tool calls and replaces executable invocations of
 * `pnpx` with `pnpm dlx` before the tool executes.
 */

import { readFileSync } from 'node:fs';

/**
 * Recursively rewrites embedded command substitutions $(...) or `...` inside strings/words.
 */
function rewriteEmbeddedSubstitutions(token: string): string {
  if (!token.includes('$(') && !token.includes('`')) {
    return token;
  }

  // Handle $(...)
  let result = '';
  let i = 0;
  while (i < token.length) {
    if (token[i] === '$' && token[i + 1] === '(') {
      let depth = 1;
      let j = i + 2;
      let inSingle = false;
      let inDouble = false;
      while (j < token.length && depth > 0) {
        const c = token[j];
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === '\'' && !inDouble) inSingle = !inSingle;
        else if (c === '"' && !inSingle) inDouble = !inDouble;
        else if (!inSingle && !inDouble) {
          if (c === '(') depth++;
          else if (c === ')') depth--;
        }
        if (depth > 0) j++;
      }
      const inner = token.slice(i + 2, j);
      result += '$(' + rewriteCommandLine(inner) + ')';
      i = j + 1;
      continue;
    }

    if (token[i] === '`') {
      let j = i + 1;
      while (j < token.length) {
        if (token[j] === '\\') {
          j += 2;
          continue;
        }
        if (token[j] === '`') break;
        j++;
      }
      const inner = token.slice(i + 1, j);
      result += '`' + rewriteCommandLine(inner) + '`';
      i = j + 1;
      continue;
    }

    result += token[i];
    i++;
  }
  return result;
}

/**
 * Rewrites command lines, replacing `pnpx` with `pnpm dlx` only in command positions.
 */
export function rewriteCommandLine(input: string): string {
  let pos = 0;
  let out = '';
  let expectingCommand = true;
  let inWrapper = false;
  let skipNextWrapperArg = false;
  let shellRunnerFlag = false; // true when immediately following -c in sh/bash/zsh

  const SHELL_RUNNERS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);
  let lastCommandToken = '';

  const WRAPPERS = new Set(['sudo', 'env', 'exec', 'nohup', 'time', 'nice', 'ionice']);
  const WRAPPER_FLAGS_WITH_VALUE = new Set([
    '-u', '-g', '-p', '-C', '-h', '-r', '-t', '-T', '-U', '-n',
    '--user', '--group', '--chdir', '--unset'
  ]);
  const CONTROL_KEYWORDS = new Set([
    'if', 'then', 'else', 'elif', 'fi', 'while', 'until', 'do', 'done', '{', '}'
  ]);

  while (pos < input.length) {
    const ch = input[pos];

    // 1. Newline resets expectingCommand to true
    if (ch === '\n') {
      out += ch;
      pos++;
      expectingCommand = true;
      inWrapper = false;
      skipNextWrapperArg = false;
      shellRunnerFlag = false;
      lastCommandToken = '';
      continue;
    }

    // 2. Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      out += ch;
      pos++;
      continue;
    }

    // 3. Two-character operators: &&, ||, ;;, |&
    const two = input.slice(pos, pos + 2);
    if (two === '&&' || two === '||' || two === ';;' || two === '|&') {
      out += two;
      pos += 2;
      expectingCommand = true;
      inWrapper = false;
      skipNextWrapperArg = false;
      shellRunnerFlag = false;
      lastCommandToken = '';
      continue;
    }

    // 4. One-character operators: ;, |, &, (, )
    if (ch === ';' || ch === '|' || ch === '&') {
      out += ch;
      pos++;
      expectingCommand = true;
      inWrapper = false;
      skipNextWrapperArg = false;
      shellRunnerFlag = false;
      lastCommandToken = '';
      continue;
    }
    if (ch === '(') {
      out += ch;
      pos++;
      expectingCommand = true;
      inWrapper = false;
      skipNextWrapperArg = false;
      shellRunnerFlag = false;
      lastCommandToken = '';
      continue;
    }
    if (ch === ')') {
      out += ch;
      pos++;
      expectingCommand = false;
      inWrapper = false;
      skipNextWrapperArg = false;
      shellRunnerFlag = false;
      continue;
    }

    // 5. Standalone command substitution: $(...) or `...`
    if (ch === '$' && input[pos + 1] === '(') {
      let depth = 1;
      let i = pos + 2;
      let inSingle = false;
      let inDouble = false;
      while (i < input.length && depth > 0) {
        const c = input[i];
        if (c === '\\') {
          i += 2;
          continue;
        }
        if (c === '\'' && !inDouble) inSingle = !inSingle;
        else if (c === '"' && !inSingle) inDouble = !inDouble;
        else if (!inSingle && !inDouble) {
          if (c === '(') depth++;
          else if (c === ')') depth--;
        }
        if (depth > 0) i++;
      }
      const inner = input.slice(pos + 2, i);
      out += '$(' + rewriteCommandLine(inner) + ')';
      pos = i + 1;
      expectingCommand = false;
      continue;
    }

    if (ch === '`') {
      let i = pos + 1;
      while (i < input.length) {
        if (input[i] === '\\') {
          i += 2;
          continue;
        }
        if (input[i] === '`') break;
        i++;
      }
      const inner = input.slice(pos + 1, i);
      out += '`' + rewriteCommandLine(inner) + '`';
      pos = i + 1;
      expectingCommand = false;
      continue;
    }

    // 6. Token / Word scanning
    let inSingle = false;
    let inDouble = false;
    let rawWord = '';

    while (pos < input.length) {
      const c = input[pos];
      if (c === '\\') {
        rawWord += c;
        if (pos + 1 < input.length) {
          rawWord += input[pos + 1];
          pos += 2;
        } else {
          pos++;
        }
        continue;
      }
      if (c === '\'' && !inDouble) {
        inSingle = !inSingle;
        rawWord += c;
        pos++;
        continue;
      }
      if (c === '"' && !inSingle) {
        inDouble = !inDouble;
        rawWord += c;
        pos++;
        continue;
      }
      if (!inSingle && !inDouble) {
        if (c === ' ' || c === '\t' || c === '\r' || c === '\n' ||
            c === ';' || c === '&' || c === '|' || c === '(' || c === ')') {
          break;
        }
      }
      rawWord += c;
      pos++;
    }

    // If shellRunnerFlag is set, this word is the argument to `sh -c`, `bash -c`, etc.
    if (shellRunnerFlag) {
      shellRunnerFlag = false;
      if ((rawWord.startsWith('"') && rawWord.endsWith('"')) ||
          (rawWord.startsWith('\'') && rawWord.endsWith('\''))) {
        const quote = rawWord[0];
        const inner = rawWord.slice(1, -1);
        out += quote + rewriteCommandLine(inner) + quote;
      } else {
        out += rewriteCommandLine(rawWord);
      }
      expectingCommand = false;
      continue;
    }

    // Determine unquoted form if entire word was quoted
    let strippedWord = rawWord;
    if ((rawWord.startsWith('"') && rawWord.endsWith('"')) ||
        (rawWord.startsWith('\'') && rawWord.endsWith('\''))) {
      strippedWord = rawWord.slice(1, -1);
    }

    // Process embedded substitutions within words (e.g. VAR=$(pnpx ...) or --pkg=`pnpx ...`)
    const processedWord = rewriteEmbeddedSubstitutions(rawWord);

    // If we are skipping the argument to a wrapper flag (e.g. `admin` in `sudo -u admin`):
    if (skipNextWrapperArg) {
      skipNextWrapperArg = false;
      out += processedWord;
      expectingCommand = true;
      continue;
    }

    // Check if this token is `pnpx` or `npx` in command position
    if (expectingCommand && (strippedWord === 'pnpx' || strippedWord === 'npx')) {
      out += 'pnpm dlx';
      expectingCommand = false;
      inWrapper = false;
      lastCommandToken = 'pnpm dlx';
      continue;
    }

    if (expectingCommand) {
      // Env assignment: FOO=bar, PORT=3000
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(strippedWord)) {
        out += processedWord;
        // expectingCommand remains true
        continue;
      }

      // Shell control keywords: if, then, else, do, etc.
      if (CONTROL_KEYWORDS.has(strippedWord)) {
        out += processedWord;
        expectingCommand = true;
        inWrapper = false;
        continue;
      }

      // Negation: ! cmd
      if (strippedWord === '!') {
        out += processedWord;
        expectingCommand = true;
        continue;
      }

      // Wrappers: sudo, env, exec, nohup, time, etc.
      if (WRAPPERS.has(strippedWord)) {
        out += processedWord;
        expectingCommand = true;
        inWrapper = true;
        continue;
      }

      // Wrapper flags
      if (inWrapper) {
        if (WRAPPER_FLAGS_WITH_VALUE.has(strippedWord)) {
          out += processedWord;
          skipNextWrapperArg = true;
          expectingCommand = true;
          continue;
        }
        if (strippedWord.startsWith('-')) {
          out += processedWord;
          expectingCommand = true;
          continue;
        }
      }

      // Regular command found
      out += processedWord;
      expectingCommand = false;
      inWrapper = false;
      lastCommandToken = strippedWord;
      continue;
    }

    // Arguments position:
    // Check if preceding command was a shell runner and this is `-c`
    if (SHELL_RUNNERS.has(lastCommandToken) && strippedWord === '-c') {
      out += processedWord;
      shellRunnerFlag = true;
      continue;
    }

    out += processedWord;
  }

  return out;
}

/**
 * Self-test suite verifying rewrite behavior across standard shell patterns.
 */
function runSelfTests() {
  const testCases: Array<{ name: string; input: string; expected: string }> = [
    {
      name: 'standalone pnpx command',
      input: 'pnpx sv create my-app',
      expected: 'pnpm dlx sv create my-app'
    },
    {
      name: 'pnpx with scoped package',
      input: 'pnpx @clerk/backend',
      expected: 'pnpm dlx @clerk/backend'
    },
    {
      name: 'pnpx with flags',
      input: 'pnpx --yes cowsay "hello"',
      expected: 'pnpm dlx --yes cowsay "hello"'
    },
    {
      name: 'chained with && operator',
      input: 'pnpm install && pnpx convex dev',
      expected: 'pnpm install && pnpm dlx convex dev'
    },
    {
      name: 'chained with || operator',
      input: 'pnpx foo || pnpx bar',
      expected: 'pnpm dlx foo || pnpm dlx bar'
    },
    {
      name: 'chained with ; operator',
      input: 'pnpx foo; pnpx bar',
      expected: 'pnpm dlx foo; pnpm dlx bar'
    },
    {
      name: 'pipeline with | operator',
      input: 'pnpx foo | pnpx bar',
      expected: 'pnpm dlx foo | pnpm dlx bar'
    },
    {
      name: 'multiline commands',
      input: 'echo hello\npnpx sv create',
      expected: 'echo hello\npnpx sv create'.replace('pnpx sv create', 'pnpm dlx sv create')
    },
    {
      name: 'environment variable prefix',
      input: 'PORT=3000 NODE_ENV=development pnpx sv dev',
      expected: 'PORT=3000 NODE_ENV=development pnpm dlx sv dev'
    },
    {
      name: 'sudo wrapper',
      input: 'sudo pnpx foo',
      expected: 'sudo pnpm dlx foo'
    },
    {
      name: 'sudo with flags',
      input: 'sudo -u admin pnpx foo',
      expected: 'sudo -u admin pnpm dlx foo'
    },
    {
      name: 'env wrapper',
      input: 'env pnpx foo',
      expected: 'env pnpm dlx foo'
    },
    {
      name: 'subshell in parens',
      input: '(pnpx foo)',
      expected: '(pnpm dlx foo)'
    },
    {
      name: 'command substitution $(...)',
      input: 'echo $(pnpx foo)',
      expected: 'echo $(pnpm dlx foo)'
    },
    {
      name: 'env assignment with command substitution',
      input: 'OUT=$(pnpx foo) echo done',
      expected: 'OUT=$(pnpm dlx foo) echo done'
    },
    {
      name: 'command substitution with backticks',
      input: 'echo `pnpx foo`',
      expected: 'echo `pnpm dlx foo`'
    },
    {
      name: 'sh -c wrapper',
      input: 'sh -c "pnpx sv create my-app"',
      expected: 'sh -c "pnpm dlx sv create my-app"'
    },
    {
      name: 'bash -c wrapper with single quotes',
      input: "bash -c 'pnpx convex dev'",
      expected: "bash -c 'pnpm dlx convex dev'"
    },
    {
      name: 'quoted pnpx binary name',
      input: '"pnpx" sv create',
      expected: 'pnpm dlx sv create'
    },
    {
      name: 'single quoted pnpx binary name',
      input: "'pnpx' sv create",
      expected: 'pnpm dlx sv create'
    },
    {
      name: 'conditional if/then/else',
      input: 'if pnpx foo; then pnpx bar; else pnpx baz; fi',
      expected: 'if pnpm dlx foo; then pnpm dlx bar; else pnpm dlx baz; fi'
    },
    {
      name: 'negated command ! pnpx',
      input: '! pnpx foo',
      expected: '! pnpm dlx foo'
    },
    {
      name: 'just pnpx alone',
      input: 'pnpx',
      expected: 'pnpm dlx'
    },
    // Non-rewrite preservation checks:
    {
      name: 'PRESERVE: git commit message mentioning pnpx',
      input: 'git commit -m "rewrite pnpx to pnpm dlx"',
      expected: 'git commit -m "rewrite pnpx to pnpm dlx"'
    },
    {
      name: 'PRESERVE: grep argument',
      input: 'grep "pnpx" package.json',
      expected: 'grep "pnpx" package.json'
    },
    {
      name: 'PRESERVE: unquoted grep argument',
      input: 'grep pnpx file.txt',
      expected: 'grep pnpx file.txt'
    },
    {
      name: 'PRESERVE: echo argument',
      input: 'echo "install via pnpx"',
      expected: 'echo "install via pnpx"'
    },
    {
      name: 'PRESERVE: which query',
      input: 'which pnpx',
      expected: 'which pnpx'
    },
    {
      name: 'PRESERVE: package or command with pnpx suffix',
      input: 'foo-pnpx bar',
      expected: 'foo-pnpx bar'
    },
    {
      name: 'PRESERVE: package or command with pnpx prefix',
      input: 'pnpx-cli run',
      expected: 'pnpx-cli run'
    },
    {
      name: 'standalone npx command',
      input: 'npx svelte-add tailwindcss',
      expected: 'pnpm dlx svelte-add tailwindcss'
    },
    {
      name: 'npx with scoped package',
      input: 'npx @clerk/backend',
      expected: 'pnpm dlx @clerk/backend'
    },
    {
      name: 'npx in chain with pnpm',
      input: 'pnpm install && npx convex dev',
      expected: 'pnpm install && pnpm dlx convex dev'
    },
    {
      name: 'npx in subshell',
      input: '(npx foo)',
      expected: '(pnpm dlx foo)'
    },
    {
      name: 'npx inside sh -c wrapper',
      input: 'sh -c "npx sv create app"',
      expected: 'sh -c "pnpm dlx sv create app"'
    },
    {
      name: 'just npx alone',
      input: 'npx',
      expected: 'pnpm dlx'
    },
    {
      name: 'PRESERVE: git commit message mentioning npx',
      input: 'git commit -m "rewrite npx to pnpm dlx"',
      expected: 'git commit -m "rewrite npx to pnpm dlx"'
    },
    {
      name: 'PRESERVE: grep argument for npx',
      input: 'grep "npx" package.json',
      expected: 'grep "npx" package.json'
    },
    {
      name: 'PRESERVE: echo argument for npx',
      input: 'echo "install via npx"',
      expected: 'echo "install via npx"'
    },
    {
      name: 'PRESERVE: which npx query',
      input: 'which npx',
      expected: 'which npx'
    },
    {
      name: 'PRESERVE: package or command with npx suffix',
      input: 'foo-npx bar',
      expected: 'foo-npx bar'
    },
    {
      name: 'PRESERVE: package or command with npx prefix',
      input: 'npx-cli run',
      expected: 'npx-cli run'
    },
    {
      name: 'PRESERVE: command already using pnpm dlx',
      input: 'pnpm dlx sv create app',
      expected: 'pnpm dlx sv create app'
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const actual = rewriteCommandLine(tc.input);
    if (actual !== tc.expected) {
      console.error(`FAIL: ${tc.name}\n  Input:    ${tc.input}\n  Expected: ${tc.expected}\n  Actual:   ${actual}`);
      process.exit(1);
    }
    passed++;
  }
  console.log(`PASS: All ${passed} tests passed successfully.`);
}

/**
 * Main entry point for Antigravity PreToolUse hook.
 */
function main() {
  if (process.argv.includes('--test')) {
    runSelfTests();
    return;
  }

  let payload: any = null;
  try {
    const raw = readFileSync(0, 'utf-8');
    if (raw.trim()) {
      payload = JSON.parse(raw);
    }
  } catch {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const toolName = payload?.toolCall?.name;
  if (toolName && toolName !== 'run_command') {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const args = payload?.toolCall?.args;
  const originalCmd = args?.CommandLine ?? args?.commandLine ?? args?.command_line;

  if (typeof originalCmd !== 'string' || (!originalCmd.includes('pnpx') && !originalCmd.includes('npx'))) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const rewrittenCmd = rewriteCommandLine(originalCmd);

  if (rewrittenCmd === originalCmd) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const result = {
    decision: 'allow',
    overwrite: {
      CommandLine: rewrittenCmd
    }
  };
  console.log(JSON.stringify(result));
}

main();
