const telegram = require('../../src/converters/telegram')
const telegram_body = require('../objects/telegram.event.json')

const natural_lang = require('../../src/utils/natural_lang')
const constants = require('../../src/utils/constants')
const utils = require('../utils')

const files = {
    commands: {
        command: {
            args: {},
            alias: []
        }
    }, outputs: {
        output: {
            args: {},
            alias: []
        }
    }
}


describe('Validation', () => {

    test('Valid event without entities', () => {
        const event = buildEvent(buildBody('text', false))
        expect(telegram.validate(event)).toStrictEqual(true)
    })

    test('Valid event with entities', () => {
        const event = buildEvent(buildBody('text', true))
        expect(telegram.validate(event)).toStrictEqual(true)
    })

    test('Http method error', () => {
        const event = buildEvent(buildBody())
        event.httpMethod = 'GET'
        expect(telegram.validate(event)).toStrictEqual(false)
    })

    test('Body error', () => {
        const event = buildEvent(buildBody())
        event.body = {}
        expect(telegram.validate(event)).toStrictEqual(false)
    })

    test('Empty event', () => {
        expect(telegram.validate({})).toStrictEqual(false)
    })

})

describe('Parse', () => {

    test('Valid event', () => {
        let body = buildBody('command output', false)
        body = calcBodyAndSetEnvVars(body, false, true, false)
        const event = buildEvent(body)
        const flow = telegram.parse(event, files)

        utils.validate.converter(flow,
            {event: body, name: telegram.filename, ok: true}
        )
        utils.validate.command(flow, telegram.getCommand(body, files.commands))
        utils.validate.output(flow, telegram.getOutput(body, files.outputs))

        expect(flow[0].command.name).not.toStrictEqual(null)
        expect(flow[0].output.name).not.toStrictEqual(null)
    })

    test('Safe mode error', () => {
        let body = buildBody('command', true)
        body = calcBodyAndSetEnvVars(body, true, true, false)

        expectParseError(body, constants.telegram.TELEGRAM_SAFE_MODE_ERROR)
    })

    test('Command error', () => {
        let body = buildBody('text', true)
        body = calcBodyAndSetEnvVars(body, false, true, false)

        expectParseError(body, constants.errors.COMMAND)
    })

    const expectParseError = (body, message) => {
        const event = buildEvent(body)

        utils.validate.converter(telegram.parse(event, files),
            {event: body, name: telegram.filename, ok: false, message: message}
        )
    }
})

describe('Name', () => {

    describe('Command', () => {

        describe('Matching', () => {

            let fn

            beforeAll(() => {
                fn = jest.spyOn(natural_lang, "checkName")
            })

            beforeEach(() => {
                fn.mockClear()
            })

            afterAll(() => {
                fn.mockRestore()
            })

            test('Valid entity ', () => {
                const body = buildBody('command', true)

                expectValidCommandName(body)
                expect(fn).not.toHaveBeenCalled()
            })

            test('Invalid entity (type)', () => {
                const body = buildBody('command', false)
                body.message.entities = [{
                    offset: -1,
                    length: 'command'.length + 1,
                    type: 'hashtag'
                }]

                expectValidCommandName(body)
                expect(fn).toHaveBeenCalled()
            })

            test('Invalid entity (offset)', () => {
                const body = buildBody('command', false)
                body.message.entities = [{
                    offset: 'command'.length + 1,
                    length: 'command'.length + 1,
                    type: 'bot_command'
                }]

                expectValidCommandName(body)
                expect(fn).toHaveBeenCalled()
            })

            test('Valid text filename', () => {
                const body = buildBody('command', false)

                expectValidCommandName(body)
                expect(fn).toHaveBeenCalled()
            })

            const expectValidCommandName = (body) => {
                const name = telegram.getCommandName(body, files.commands)
                expect(name).toStrictEqual(body.message.text)
            }

            test('Valid text alias', () => {
                const alias = 'custom_alias'
                let commands = {}
                commands['command'] = {
                    args: {},
                    alias: [alias]
                }

                const body = buildBody(alias, false)
                const name = telegram.getCommandName(body, commands)

                expect(name).toStrictEqual('command')
                expect(fn).toHaveBeenCalled()
            })

        })

        test('Entity not matching', () => {
            expectErrorCommandName('text', true, constants.errors.COMMAND)
        })

        test('Text not matching', () => {
            expectErrorCommandName('text', false, constants.errors.COMMAND)
        })

        const expectErrorCommandName = (text, entity, error) => {
            const fn = () => {
                const body = buildBody(text, entity)
                telegram.getCommandName(body, files.commands)
            }

            expect(fn).toThrowError(error)
        }

    })

    describe('Output', () => {

        test('Valid text filename', () => {
            expectOutputName('output', 'output', files.outputs)
        })

        test('Valid text alias', () => {
            const alias = 'custom_alias'
            let outputs = {}
            outputs['command'] = {
                args: {},
                alias: [alias]
            }

            expectOutputName(alias, 'command', outputs)
        })

        test('Not matching', () => {
            expectOutputName('text', null, files.outputs)
        })

        test('Matching with converter', () => {
            let outputs = {}
            outputs[telegram.filename] = {
                args: {},
                alias: []
            }

            expectOutputName('text', telegram.filename, outputs)
        })

        const expectOutputName = (text, result, outputs) => {
            const body = buildBody(text, false)
            const name = telegram.getOutputName(body, outputs)

            expect(name).toStrictEqual(result)
        }

    })

})

describe('Args', () => {

    describe('Command', () => {

        test('Default', () => {
            const body = buildBody('text', false)
            const args = telegram.getCommandArgs(body, files.commands, 'command')

            expect(args).toStrictEqual(expect.objectContaining(
                {
                    first_name: body.message.chat.first_name,
                    username: body.message.chat.username,
                    language_code: body.message.from.language_code,
                    text: body.message.text,
                }
            ))
        })

        test('Custom', () => {
            expectCustomArgs(telegram.getCommandArgs)
        })

    })


    describe('Output', () => {

        test('Name matching', () => {
            const body = buildBody('text', false)
            const args = telegram.getOutputArgs(body, null, telegram.filename)

            expect(args).toStrictEqual(expect.objectContaining(
                {
                    chat_id: body.message.chat.id,
                    message_id: body.message.message_id
                }
            ))
        })

        test('Custom', () => {
            expectCustomArgs(telegram.getOutputArgs)
        })

        test('Not matching', () => {
            expectOutputNoArgs('output')
        })

        test('Null name', () => {
            expectOutputNoArgs(null)
        })

        const expectOutputNoArgs = (name) => {
            const body = buildBody('text', false)
            const args = telegram.getOutputArgs(body, files.outputs, name)

            expect(args).toStrictEqual({})
        }

    })

    const expectCustomArgs = (fun) => {
        let name = 'output'
        let arg = 'custom_arg'
        let value = 'custom_value'

        let object = {}
        object[name] = {
            args: {},
            alias: []
        }
        object[name].args[arg] = [value]

        const body = buildBody(value, false)
        const args = fun(body, object, name)

        expect(args).toHaveProperty(arg)
        expect(args[arg]).toStrictEqual(value)
    }

})

describe('Safe mode', () => {

    test('Valid', () => {
        const fn = () => safeModeFun(true, false, true)

        expect(fn).not.toThrowError(constants.telegram.TELEGRAM_SAFE_MODE_ERROR)
    })

    test('Disabled', () => {
        const fn = () => safeModeFun(false, true, false)

        expect(fn).not.toThrowError(constants.telegram.TELEGRAM_SAFE_MODE_ERROR)
    })

    test('Sender is bot', () => {
        const fn = () => safeModeFun(true, true, true)

        expect(fn).toThrowError(constants.telegram.TELEGRAM_SAFE_MODE_ERROR)
    })

    test('Chat id not in whitelist', () => {
        const fn = () => safeModeFun(true, false, false)

        expect(fn).toThrowError(constants.telegram.TELEGRAM_SAFE_MODE_ERROR)
    })

    const safeModeFun = (safeModeEnabled, isBot, whitelisted) => {
        let body = buildBody('text', false)
        body = calcBodyAndSetEnvVars(body, safeModeEnabled, isBot, whitelisted)
        telegram.checkSafeMode(body)
    }

})

const buildBody = (text, entity) => {
    let body = utils.safeObjectClone(telegram_body)
    body.message.text = text
    if (entity) {
        body.message.entities = [{
            offset: -1,
            length: text.length + 1,
            type: 'bot_command'
        }]
    }
    return body
}
const buildEvent = (body) => {
    const event = {}
    event.body = JSON.stringify(body)
    event.httpMethod = 'POST'
    return event
}

const calcBodyAndSetEnvVars = (body, safeModeEnabled, isBot, whitelisted) => {
    process.env.TELEGRAM_SAFE_MODE = safeModeEnabled ? "true" : "false"
    process.env.TELEGRAM_CHAT_ID_WHITELST = whitelisted ? body.message.chat.id.toString() : ''
    body.message.from.is_bot = isBot
    return body
}
