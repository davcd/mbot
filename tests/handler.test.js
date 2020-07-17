const handler = require('../src/handler')

const constants = require('../src/utils/constants')
const utils = require('./utils')


describe('Entrypoint', () => {
    const original_files = handler.files

    beforeEach(() => {
        console.log.mockClear()
    })

    afterAll(() => {
        handler.files = original_files
    })

    const flow = {
        converter: {ok: true},
        command: {name: 'test'},
        output: {name: 'test'}
    }

    const files = {
        converters: {test: {}},
        commands: {test: {}},
        outputs: {test: {}}
    }

    test('Complete flow', async () => {
        const command_result = {command_result: true}
        const output_result = {output_result: true}

        let custom_flow = utils.safeObjectClone(flow)
        let custom_files = utils.safeObjectClone(files)

        custom_files.converters.test.validate = jest.fn(() => true)
        custom_files.converters.test.parse = jest.fn(() => [custom_flow])
        custom_files.commands.test.execute = jest.fn(() => [command_result])
        custom_files.outputs.test.execute = jest.fn(() => [output_result])

        handler.files = custom_files
        await handler.entrypoint({})

        custom_flow.command.result = [command_result]
        custom_flow.output.result = [output_result]

        expectConverterMatching([custom_flow])
        expectConverterFunctionsCalled()
        expect(handler.files.commands.test.execute).toHaveBeenCalled()
        expect(handler.files.outputs.test.execute).toHaveBeenCalled()
    })

    test('Empty command output', async () => {
        let custom_flow = utils.safeObjectClone(flow)
        let custom_files = utils.safeObjectClone(files)

        custom_files.converters.test.validate = jest.fn(() => true)
        custom_files.converters.test.parse = jest.fn(() => [custom_flow])
        custom_files.commands.test.execute = jest.fn(() => [])

        handler.files = custom_files
        await handler.entrypoint({})

        custom_flow.command.result = []

        expectConverterMatching([custom_flow])
        expectConverterFunctionsCalled()
        expect(handler.files.commands.test.execute).toHaveBeenCalled()
    })

    test('Converter ok false', async () => {
        const message = 'Error parsing event'

        let custom_flow = utils.safeObjectClone(flow)
        custom_flow.converter.ok=false
        custom_flow.converter.message=message

        let custom_files = utils.safeObjectClone(files)
        custom_files.converters.test.validate = jest.fn(() => true)
        custom_files.converters.test.parse = jest.fn(() => [custom_flow])

        handler.files = custom_files
        await handler.entrypoint({})

        expectConverterOkFalse(message)
        expectConverterFunctionsCalled()
    })

    test('Converters not matching', async () => {
        let custom_files = utils.safeObjectClone(files)
        custom_files.converters.test.validate = jest.fn(() => false)
        custom_files.converters.test.parse = jest.fn(() => [])

        handler.files = custom_files
        await handler.entrypoint({})

        expectConverterNotMatching()
        expect(handler.files.converters.test.validate).toHaveBeenCalled()
        expect(handler.files.converters.test.parse).not.toHaveBeenCalled()
    })


    const expectConverterMatching = (flow) => {
        expect(console.log).toHaveBeenCalled()
        expect(JSON.parse(console.log.mock.calls[0][0])).toStrictEqual(flow)
    }

    const expectConverterOkFalse = (string) => {
        expect(console.log).toHaveBeenCalled()
        expect(console.log.mock.calls[0][0]).toStrictEqual(string)
    }

    const expectConverterNotMatching = () => {
        expect(console.log).toHaveBeenCalled()
        expect(console.log.mock.calls[0][0]).toStrictEqual(constants.errors.EVENT)
        expect(console.log.mock.calls[0][1]).toStrictEqual({})
    }

    const expectConverterFunctionsCalled = () =>{
        expect(handler.files.converters.test.validate).toHaveBeenCalled()
        expect(handler.files.converters.test.parse).toHaveBeenCalled()
    }

})