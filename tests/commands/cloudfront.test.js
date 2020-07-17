const cloudfront = require('../../src/commands/cloudfront')
const athena_result = require('../objects/athena.result.json')

const utils = require('../utils')
const constants = require('../../src/utils/constants')

const flow = {command: {args: []}}
const args = cloudfront.args
args.datetime = {
    start: 'X',
    end: 'Y',
    duration: 'Z'
}


beforeEach(() => {
    console.log.mockClear()
})

describe('Execute', () => {

    test('Athena returns data', async () => {
        mockAthenaExpress(athena_result)

        const result = await cloudfront.execute(flow)

        expect(result).toStrictEqual(utils.expectCommandResult)
    })

    test('Empty athena query', async () => {
        mockAthenaExpress(null)

        const result = await cloudfront.execute(flow)
        expect(result).toStrictEqual([])
    })

    test('Unexpected error', async () => {
        const result = await cloudfront.execute({})
        expect(result).toStrictEqual([])
        expect(console.log).toHaveBeenCalled()
    })

})

describe('Build message', () => {

    test('No data', () => {
        const result = cloudfront.buildMessage({Items: []}, args)

        expect(result.type).toStrictEqual(constants.types.HTML)
        expect(result.content).toContain('No data found')
        expect(result.content).not.toContain('Protocol')
        expect(result.content).not.toContain('Viewers platform')
    })

    test('Unexpected error', () => {
        const result = buildMessage({})

        expect(result.content).toStrictEqual('')
        expect(console.log).toHaveBeenCalled()
    })

    test('Template resume', () => {
        args.template = 'resume'
        const result = buildMessage(args)

        expect(result.content).not.toContain('No data found')
        expect(result.content).toContain('Protocol')
        expect(result.content).not.toContain('Viewers platform')
    })

    test('Template extended', () => {
        args.template = 'extended'
        const result = buildMessage(args)

        expect(result.content).not.toContain('No data found')
        expect(result.content).toContain('Protocol')
        expect(result.content).toContain('Viewers platform')
    })

    const buildMessage = (args) => {
        const result = cloudfront.buildMessage(athena_result, args)

        expect([result]).toStrictEqual(utils.expectCommandResult)
        expect(result.type).toStrictEqual(constants.types.HTML)

        return result
    }

})

describe('Athena query', () => {

    test('Ok', async () => {
        mockAthenaExpress(athena_result)
        const data = await cloudfront.getCloudfrontInfoByAthena(args)

        expect(data).toStrictEqual(athena_result)
        expect(console.log).not.toHaveBeenCalled()
    })

    test('Error', async () => {
        mockAthenaExpress(null)
        const data = await cloudfront.getCloudfrontInfoByAthena({})

        expect(data).toStrictEqual(null)
        expect(console.log).toHaveBeenCalled()
    })

})

const mockAthenaExpress = (result) => {
    cloudfront.AthenaExpress = class AthenaExpress {
        constructor(init) {
        }

        query() {
            return Promise.resolve(result)
        }
    }
}