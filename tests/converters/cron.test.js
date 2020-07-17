const cron = require('../../src/converters/cron')
const cron_object = require('../objects/cron.event.json')

const constants = require('../../src/utils/constants')
const utils = require('../utils')

const files = {
    commands: {
        test: {}
    }, outputs: {
        test: {}
    }
}


describe('Validation', () => {

    test('Valid event', () => {
        const event = buildEvent('test', 'test')
        expect(cron.validate([event])).toStrictEqual(true)
    })

    test('Empty event', () => {
        expect(cron.validate([])).toStrictEqual(false)
    })

})

describe('Parse', () => {

    test('Multiple valid events', () => {
        const event = buildEvent('test', 'test')
        const length = Math.floor(Math.random() * 10) + 1
        const flow = cron.parse(Array(length).fill(event), files)

        utils.validate.converter(flow,
            {event: event, name: cron.filename, ok: true}
        )
        utils.validate.command(flow, event.command)
        utils.validate.output(flow, event.output)

        expect(flow.length).toStrictEqual(length)
    })

    test('Command error', () => {
        const event = buildEvent('wrong_command', 'test')
        expectParseError(event, constants.errors.COMMAND)
    })

    test('Output error', () => {
        const event = buildEvent('test', 'wrong_output')
        expectParseError(event, constants.errors.OUTPUT)
    })

    test('Command and output errors', () => {
        const event = buildEvent('wrong_command', 'wrong_output')
        expectParseError(event, [constants.errors.COMMAND, constants.errors.OUTPUT].join(', '))
    })

    test('Empty event', () => {
        expect(cron.parse([], files)).toStrictEqual([])
    })

    const expectParseError = (event, message) => {
        utils.validate.converter(cron.parse([event], files),
            {event: event, name: cron.filename, ok: false, message: message}
        )
    }

})

const buildEvent = (command, output) => {
    const event = utils.safeObjectClone(cron_object)
    event.command.name = command
    event.output.name = output
    return event
}