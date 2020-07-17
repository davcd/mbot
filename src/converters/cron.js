const yup = require('yup')

const constants = require('../utils/constants')

const filename = __filename.slice(__dirname.length + 1, -3)


const validate = (event) => {
    let result = false

    if (schema.isValidSync(event)) {
        result = true
    }

    return result
}


const schema = yup
    .array()
    .of(
        yup.object().shape({
            command: yup.object().required().shape({
                name: yup.string().required(),
                args: yup.object().required(),
            }),
            output: yup.object().required().shape({
                name: yup.string().required(),
                args: yup.object().required(),
            }),
        })
    )
    .min(1)
    .required()

const parse = (event, files) => {
    let result = []
    let error = []

    for (let i = 0; i < event.length; i++) {
        error = []

        if (!Object.keys(files.commands).includes(event[i].command.name)) {
            error.push(constants.errors.COMMAND)
        }
        if (!Object.keys(files.outputs).includes(event[i].output.name)) {
            error.push(constants.errors.OUTPUT)
        }

        if (error.length === 0) {
            result.push({
                converter: {
                    name: filename,
                    event: event[i],
                    ok: true,
                },
                command: event[i].command,
                output: event[i].output,
            })
        } else {
            result.push({
                converter: {
                    name: filename,
                    event: event[i],
                    ok: false,
                    message: error.join(', '),
                },
            })
        }
    }

    return result
}

module.exports = {
    validate,
    parse,
    filename
}
