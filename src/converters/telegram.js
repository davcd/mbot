const yup = require('yup')

const natural_lang = require('../utils/natural_lang')

const common = require('../utils/common')
const constants = require('../utils/constants')

const filename = __filename.slice(__dirname.length + 1, -3)


const validate = (event) => {
    let result = false

    if (event.httpMethod === 'POST' && schema.isValidSync(common.safeJsonParse(event.body))) {
        result = true
    }

    return result
}

const schema = yup.object().shape({
    update_id: yup.number().required(),
    message: yup
        .object()
        .required()
        .shape({
            message_id: yup.number().required(),
            from: yup.object().required().shape({
                id: yup.number().required(),
                is_bot: yup.boolean().required(),
                first_name: yup.string().required(),
                username: yup.string().required(),
                language_code: yup.string().required(),
            }),
            chat: yup.object().required().shape({
                id: yup.number().required(),
                first_name: yup.string().required(),
                username: yup.string().required(),
                type: yup.string().required(),
            }),
            date: yup.date().required(),
            text: yup.string().required(),
            entities: yup
                .array()
                .of(
                    yup.object().shape({
                        offset: yup.number().required(),
                        length: yup.number().required(),
                        type: yup.string().required(),
                    })
                )
                .min(1)
                .default(null)
                .nullable(),
        }),
})

const parse = (event, files) => {
    const body = common.safeJsonParse(event.body)

    try {
        checkSafeMode(body)
        const command = getCommand(body, files.commands)
        const output = getOutput(body, files.outputs)

        return [
            {
                converter: {
                    name: filename,
                    event: body,
                    ok: true,
                },
                command,
                output,
            },
        ]
    } catch (error) {
        return [
            {
                converter: {
                    name: filename,
                    event: body,
                    ok: false,
                    message: error.message,
                },
            },
        ]
    }
}

const getCommand = (body, commands) => {
    const name = getCommandName(body, commands)
    const args = getCommandArgs(body, commands, name)

    return {name, args, result: []}
}

const getCommandName = (body, commands) => {
    let name = null

    if (body.message.entities !== undefined && body.message.entities.length > 0) {
        let offset = body.message.text.length
        for (let i = 0; i < body.message.entities.length && offset > 0; i++) {
            if (
                body.message.entities[i].type === 'bot_command' &&
                body.message.entities[i].offset < offset
            ) {
                const current_name = body.message.text
                    .substring(
                        body.message.entities[i].offset + 1,
                        body.message.entities[i].offset + body.message.entities[i].length
                    )
                    .toLowerCase()
                if (Object.keys(commands).includes(current_name)) {
                    name = current_name
                    offset = body.message.entities[i].offset
                }
            }
        }
    }

    if (name === null) {
        let natural = natural_lang.checkName(body.message.text, commands)
        if (natural !== null) {
            name = natural
        } else {
            throw new Error(constants.errors.COMMAND)
        }
    }

    return name
}

const getCommandArgs = (body, commands, command_name) => {
    return {
        ...natural_lang.checkArgs(body.message.text, commands[command_name].args),
        first_name: body.message.chat.first_name,
        username: body.message.chat.username,
        language_code: body.message.from.language_code,
        text: body.message.text,
    }
}

const getOutput = (body, outputs) => {
    const name = getOutputName(body, outputs)
    const args = getOutputArgs(body, outputs, name)

    return {name, args, result: []}
}

const getOutputName = (body, outputs) => {
    let name = null
    let natural = natural_lang.checkName(body.message.text, outputs)

    if (natural !== null) {
        name = natural
    } else if (Object.keys(outputs).includes(filename)) {
        name = filename
    }

    return name
}

const getOutputArgs = (body, outputs, name) => {
    let args = {}

    if (name !== null) {
        if (filename === name) {
            args = {
                chat_id: body.message.chat.id,
                message_id: body.message.message_id,
            }
        } else {
            args = natural_lang.checkArgs(body.message.text, outputs[name].args)
        }
    }

    return args
}

const checkSafeMode = (body) => {
    if (
        process.env.TELEGRAM_SAFE_MODE === 'true' &&
        (
            body.message.from.is_bot ||
            !process.env.TELEGRAM_CHAT_ID_WHITELST.split(',').includes(
                body.message.chat.id.toString()
            )
        )
    ) {
        throw new Error(constants.telegram.TELEGRAM_SAFE_MODE_ERROR)
    }
}

module.exports = {
    validate,
    parse,
    getCommand,
    getCommandArgs,
    getCommandName,
    getOutput,
    getOutputArgs,
    getOutputName,
    checkSafeMode,
    filename
}
