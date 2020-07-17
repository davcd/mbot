const handler = require('../src/handler')

const natural_lang = require('../src/utils/natural_lang')

const files = handler.files
const arrays = {
    converters: Object.keys(files.converters),
    commands: Object.keys(files.commands),
    outputs: Object.keys(files.outputs)
}


describe('File exports requirements', () => {

    test('Handler', () => {
        expect(handler).toStrictEqual(
            expect.objectContaining({
                entrypoint: expect.any(Function),
                files: expect.any(Object),
            })
        )
    })

    test('Converters', () => {
        for (const converter in files.converters) {
            if(files.converters.hasOwnProperty(converter)){
                expect(files.converters[converter]).toStrictEqual(
                    expect.objectContaining({
                        validate: expect.any(Function),
                        parse: expect.any(Function),
                    })
                )
            }
        }
    })

    test('Commands', () => {
        for (const command in files.commands) {
            if(files.commands.hasOwnProperty(command)) {
                expect(files.commands[command]).toStrictEqual(
                    expect.objectContaining({
                        args: expect.any(Object),
                        alias: expect.any(Object),
                        execute: expect.any(Function),
                    })
                )
            }
        }
    })

    test('Outputs', () => {
        for (const output in files.outputs) {
            if(files.outputs.hasOwnProperty(output)) {
                expect(files.outputs[output]).toStrictEqual(
                    expect.objectContaining({
                        args_default: expect.any(Object),
                        execute: expect.any(Function),
                    })
                )
            }
        }
    })

})

describe('File requirements', () => {

    test('Converters', () => {
        expect(arrays.converters.length).toBeGreaterThan(0)
    })

    test('Commands', () => {
        expect(arrays.commands.length).toBeGreaterThan(0)
    })

})

describe('Natural lang naming', () => {

    test('Commands', () => {
        expect(arrays.commands).toStrictEqual(
            arrays.commands.map(
                x => natural_lang.normalizeText(x)
            )
        )
    })

    test('Outputs', () => {
        expect(arrays.outputs).toStrictEqual(
            arrays.outputs.map(
                x => natural_lang.normalizeText(x)
            )
        )
    })

})