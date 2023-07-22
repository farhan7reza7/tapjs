import { LoadedConfig } from '@tapjs/config'
import {Minimal} from '@tapjs/core'
import chalk from 'chalk'
import { Box, Text } from 'ink'
import { render } from 'ink-testing-library'
import React from 'react'
import t from 'tap'
import { logs } from '../fixtures/logs.js'

chalk.level = 3

const { Log } = (await t.mockImport('../../dist/terse/log.js', {
  chalk,
  '../../dist/terse/test-summary.js': {
    TestSummary: ({ test }: { test: { name: string } }) => (
      <Box>
        <Text>XXX test summary {test.name} XXX</Text>
      </Box>
    ),
  },
  '../../dist/hooks/use-log.js': t.createMock(
    await import('../../dist/hooks/use-log.js'),
    {
      useLog: () => logs,
    }
  ),
})) as typeof import('../../dist/terse/log.js')

t.matchSnapshot(
  render(<Log test={t} config={{} as LoadedConfig} />).lastFrame()
)

const tb = new Minimal({ name: 'ended' })
tb.pass('this is fine')
tb.end()
await tb.concat()
t.equal(
  render(<Log test={tb} config={{} as LoadedConfig} />).lastFrame(),
  '',
  'nothing to log if test is finished'
)