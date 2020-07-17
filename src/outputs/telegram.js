const axios = require('axios')
const constants = require('../utils/constants')

const args_default = {
    api_token: process.env.TELEGRAM_API_TOKEN,
    chat_id: parseInt(process.env.TELEGRAM_CHAT_ID_DEFAULT, 10),
}

const getSendMessageUrl = (args, result) => {
    let url =
        `https://api.telegram.org/bot${args.api_token}` +
        `/sendMessage?chat_id=${args.chat_id}` +
        `&text=${encodeURIComponent(result.content)}` +
        '&disable_web_page_preview=True'

    if (result.type === constants.types.HTML) {
        url += '&parse_mode=HTML'
    }
    if (args.message_id !== undefined) {
        url += `&reply_to_message_id=${args.message_id}`
    }
    return url
}

const getDeleteMessageUrl = (args) => `https://api.telegram.org/bot${args.api_token}/deleteMessage?chat_id=${args.chat_id}&message_id=${args.message_id}`

const resolveAxiosPromise = async (url) => Promise.resolve(axios.get(url))
    .then((response) => response)
    .catch(() => null)


const execute = async (flow) => {
    let result = []

    try {
        for (let i = 0; i < flow.command.result.length; i++) {
            let url = null

            if (
                [constants.types.STRING, constants.types.HTML].includes(
                    flow.command.result[i].type
                )
            ) {
                url = getSendMessageUrl(
                    {
                        ...args_default,
                        ...flow.output.args,
                    },
                    flow.command.result[i]
                )
                const response = await module.exports.resolveAxiosPromise(url)
                result.push(response !== null ? response.data : constants.telegram.TELEGRAM_API_REQUEST_ERROR)

            } else {
                result.push(`Type ${flow.command.result[i].type} not supported`)
            }
        }
    } catch (error) {
        console.log(JSON.stringify(error))
    }
    return result
}

module.exports = {
    args_default,
    execute,
    getSendMessageUrl,
    getDeleteMessageUrl,
    resolveAxiosPromise
}
