const okObject = {
    message: () => "Ok",
    pass: true
}

expect.extend({
    toBeTypeOrNull(received, argument) {
        if (received === null || received instanceof argument || typeof (received) === argument.name.toLowerCase()) {
            return okObject
        } else {
            return {
                message: () => `expected ${received} to be ${argument} type or null`,
                pass: false
            }
        }
    },
    toBeObjectContainingOrNull(received, argument) {
        if (received === null || expect(received).toEqual(expect.objectContaining(argument))) {
            return okObject
        } else {
            return {
                message: () => `expected ${received} to be ${argument} type or null`,
                pass: false
            }
        }
    },
    toBeArrayContainingOrNullOrEmpty(received, argument) {
        if (
            received === null ||
            (Array.isArray(received) && received.length === 0) ||
            expect(received).toEqual(expect.arrayContaining(argument))
        ) {
            return okObject
        } else {
            return {
                message: () => `expected ${received} to be ${argument} type or null`,
                pass: false
            }
        }
    }
})

const expectCommandResult = [
    expect.objectContaining({
        type: expect.any(String),
        content: expect.anything(),
    })
]

const validate = {
    converter: (flow, object) => {
        expect(flow).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    converter: expect.objectContaining(object)
                })
            ])
        )
    },
    command: (flow, object) => {
        expect(flow).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    command: expect.objectContaining({
                        name: expect.any(String),
                        args: expect.any(Object),
                        result: expect.toBeArrayContainingOrNullOrEmpty(expectCommandResult)
                    })
                })
            ])
        )
        for (let i = 0; i < flow.length; i++) {
            if (object !== null) {
                expect(flow[i].command).toStrictEqual(object)
            }
        }
    },
    output: (flow, object) => {
        expect(flow).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    output: expect.objectContaining({
                        name: expect.toBeTypeOrNull(String),
                        args: expect.any(Object),
                        result: expect.toBeTypeOrNull(Array)
                    })
                })
            ])
        )
        for (let i = 0; i < flow.length; i++) {
            expect(flow[i].output.result.length).toStrictEqual(flow[i].command.result.length)
            if (object !== null) {
                expect(flow[i].output).toStrictEqual(object)
            }
        }
    }
}

const safeObjectClone = (object) => {
    let clone

    try {
        clone = JSON.parse(JSON.stringify(object))
    } catch (error) {
        clone = false
    }

    return clone
}

module.exports = {
    expect,
    validate,
    expectCommandResult,
    safeObjectClone
}