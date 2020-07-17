const hello = require('../../src/commands/hello')

const utils = require('../utils')


test('Result', async () => {
    const result = await hello.execute()

    expect(result).toStrictEqual(
        expect.arrayContaining(
            utils.expectCommandResult
        )
    )
})
