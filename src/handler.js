const constants = require('./utils/constants')
const common = require('./utils/common')

const files = {
    converters: common.folderRequire('./src/converters/*.js'),
    commands: common.folderRequire('./src/commands/*.js'),
    outputs: common.folderRequire('./src/outputs/*.js'),
}

const entrypoint = async (event) => {
    let flow = []

    for (const converter in module.exports.files.converters) {
        if (module.exports.files.converters.hasOwnProperty(converter) && module.exports.files.converters[converter].validate(event)) {
            flow = module.exports.files.converters[converter].parse(event, module.exports.files)
            break
        }
    }

    if (flow.length > 0) {
        for (let i = 0; i < flow.length; i++) {
            if (flow[i].converter.ok === true) {
                flow[i].command.result = await module.exports.files.commands[
                    flow[i].command.name
                    ].execute(flow[i])
                if (flow[i].command.result.length > 0) {
                    flow[i].output.result = await module.exports.files.outputs[
                        flow[i].output.name
                        ].execute(flow[i])
                }
            } else {
                console.log(flow[i].converter.message)
            }
        }
        console.log(JSON.stringify(flow))
    } else {
        console.log(constants.errors.EVENT, event)
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: constants.responses.STANDARD,
        }),
    }
}

module.exports = {
    entrypoint,
    files
}
