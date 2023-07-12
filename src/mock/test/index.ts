import { relative } from 'path'
import t from 'tap'
import {
  loader,
  mockImport as MIfromIndex,
  mockRequire as MRfromIndex,
  plugin,
} from '../dist/cjs/index.js'
import { mockImport } from '../dist/cjs/mock-import.js'
import { mockRequire } from '../dist/cjs/mock-require.js'

import * as fs from 'node:fs'

t.equal(mockImport, MIfromIndex)
t.equal(mockRequire, MRfromIndex)
t.equal(t.pluginLoaded(plugin), true, 'plugin loaded by default')
t.equal(loader, '@tapjs/mock', 'loader')

t.test('mockRequire', t => {
  const dir = t.testdir({
    'file.cjs': `
      exports.foo = require('./foo.js')
    `,
    'foo.js': `
      module.exports = 'original foo'
    `,
  })
  const rel = './' + relative(__dirname, dir) + '/'
  const mocked = t.mockRequire(rel + 'file.cjs', {
    [rel + 'foo.js']: 'mocked foo',
  })
  t.strictSame(mocked, { foo: 'mocked foo' })
  t.end()
})

t.test('deprecated t.mock alias', t => {
  const logs = t.capture(console, 'error')
  const dir = t.testdir({
    'file.cjs': `
      exports.foo = require('./foo.js')
    `,
    'foo.js': `
      module.exports = 'original foo'
    `,
  })
  const rel = './' + relative(__dirname, dir) + '/'
  const mocked = t.mock(rel + 'file.cjs', {
    [rel + 'foo.js']: 'mocked foo',
  })
  t.strictSame(mocked, { foo: 'mocked foo' })
  t.match(logs(), [
    {
      args: [
        't.mock() is now t.mockRequire(). Please update your tests.',
      ],
    },
  ])
  t.end()
})

t.test('mockImport', async t => {
  const dir = t.testdir({
    'file.mjs': `
      import f from './foo.mjs'
      export const foo = f
    `,
    'foo.mjs': `
      export default 'original foo'
    `,
  })
  const rel = './' + relative(__dirname, dir) + '/'
  const mocked = await t.mockImport(rel + 'file.mjs', {
    [rel + 'foo.mjs']: 'mocked foo',
  })
  t.strictSame(mocked, { __proto__: null, foo: 'mocked foo' })
  t.end()
})

t.test('createMock', t => {
  const dir = t.testdir({
    'file.cjs': `
      exports.foo = require('./foo.js')
    `,
    'foo.js': `
      module.exports = [
        require('fs').statSync(__filename),
        require('fs').lstatSync(__filename),
      ]
    `,
  })
  const rel = './' + relative(__dirname, dir) + '/'
  const mocked = t.mockRequire(rel + 'file.cjs', {
    fs: t.createMock(fs, { statSync: () => 'mocked statSync' }),
  })
  t.match(mocked, { foo: ['mocked statSync', fs.Stats] })
  t.end()
})

t.test('createMock nested', t => {
  const dir = t.testdir({
    'file.cjs': `
      exports.foo = require('./foo.js')
    `,
    'foo.js': `
      module.exports = [
        require('fs').statSync(__filename),
        require('fs').lstatSync(__filename),
      ]
    `,
  })
  const rel = './' + relative(__dirname, dir) + '/'
  const mocked = t.mockRequire(
    rel + 'file.cjs',
    t.createMock(
      { fs },
      {
        fs: { statSync: () => 'mocked statSync' },
      }
    )
  )
  t.match(mocked, { foo: ['mocked statSync', fs.Stats] })
  t.end()
})

t.test('createMock array', t => {
  t.strictSame(t.createMock([1, 2, 3], [3, 2, 1]), [3, 2, 1])
  t.end()
})