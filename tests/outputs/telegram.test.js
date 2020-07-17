const telegram = require('../../src/outputs/telegram')

const constants = require('../../src/utils/constants')
const utils = require('../utils')

const axios = require('axios')
axios.defaults.adapter = require('axios/lib/adapters/http')
const nock = require('nock')

const content = 'Any content'
const empty_flow = {
    converter: {},
    command: {
        args: {},
        result: []
    },
    output: {
        args: {},
        result: []
    }
}


describe('Execute', async () => {

    test('Multiple valid command results', async () => {
        const mock_response = {mock: true}
        nock('https://api.telegram.org')
            .filteringPath(() => '/')
            .get('/')
            .times(2)
            .reply(200, mock_response)

        let flow = utils.safeObjectClone(empty_flow)
        flow.command.result.push({type: constants.types.HTML, content})
        flow.command.result.push({type: constants.types.STRING, content})

        const result = await telegram.execute(flow)
        expect(result).toStrictEqual([mock_response, mock_response])
    })

    test('Request error', async () => {
        nock("https://api.telegram.org")
            .filteringPath(() => '/')
            .get('/')
            .replyWithError('Something went wrong');

        let flow = utils.safeObjectClone(empty_flow)
        flow.command.result.push({type: constants.types.HTML, content})

        const result = await telegram.execute(flow)
        expect(result).toStrictEqual([constants.telegram.TELEGRAM_API_REQUEST_ERROR])
    })

    test('Not supported command result type', async () => {
        let flow = utils.safeObjectClone(empty_flow)
        const wrong_type = 'non-valid'
        flow.command.result.push({type: wrong_type, content})

        const result = await telegram.execute(flow)
        expect(result).toStrictEqual([`Type ${wrong_type} not supported`])
    })

    test('Empty command result', async () => {
        let flow = utils.safeObjectClone(empty_flow)
        const result = await telegram.execute(flow)
        expect(result).toStrictEqual([])
    })

    test('Wrong command result', async () => {
        const result = await telegram.execute({})
        expect(result).toStrictEqual([])
        expect(console.log).toHaveBeenCalled()
    })

})

describe('Get url for sendMessage telegram API endpoint', () => {

    test('getSendMessageUrl contains parse_mode', async () => {
        const url = telegram.getSendMessageUrl(telegram.args_default, {type: constants.types.HTML, content})
        expect(url).toStrictEqual(expect.any(String))
        expect(url).toContain('&parse_mode=HTML')
        expect(url).not.toContain('reply_to_message_id')

    })

    test('getSendMessageUrl contains reply_to_message_id', async () => {
        const message_id = 1234556
        const url = telegram.getSendMessageUrl({
            ...telegram.args_default,
            message_id,
        }, {type: constants.types.STRING, content})
        expect(url).toStrictEqual(expect.any(String))
        expect(url).not.toContain('parse_mode=')
        expect(url).toContain(`&reply_to_message_id=${message_id}`)
    })

})

describe('Get url for deleteMessage telegram API endpoint', () => {

    test('getDeleteMessageUrl', async () => {
        const url = telegram.getDeleteMessageUrl({
            ...telegram.args_default,
            message_id: 1234556,
        })
        expect(url).toStrictEqual(expect.any(String))
    })

})