const errors = {
    EVENT: 'Event error',
    COMMAND: 'Command error',
    OUTPUT: 'Output error',
}

const responses = {
    STANDARD: 'Thanks!',
}

const types = {
    HTML: 'html',
    STRING: 'string',
    IMAGE: 'image',
}


const telegram = {
    TELEGRAM_SAFE_MODE_ERROR: 'Telegram safe mode error',
    TELEGRAM_API_REQUEST_ERROR: 'Telegram API request error',
    frequency: {
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
        YESTERDAY: 'yesterday',
        LAST_WEEK: 'last_week',
        LAST_MONTH: 'last_month',
        LAST_YEAR: 'last_year'
    }
}

module.exports = {
    errors,
    responses,
    types,
    telegram
}
