const glob = require('glob')
const path = require('path')

const moment = require('moment-timezone')
const constants = require('./constants')


const folderRequire = (string) => {
    const folder = {}

    glob.sync(string).forEach(file => {
        folder[path.parse(file).name] = require(path.resolve(file))
    })

    return folder
}

const safeJsonParse = (data) => {
    let parsed

    try {
        parsed = JSON.parse(data)
    } catch (error) {
        parsed = false
    }

    return parsed
}

const safePercentage = (number, total, decimals) => {
    if (number === 0) {
        return 0
    }

    let percentage = number * 100 / total

    if (Number.isInteger(percentage)) {
        return percentage
    } else {
        return percentage.toFixed(decimals)
    }
}

const calcRangeDatetime = (frequency) => {
    const datetime = {}

    let current_safe = moment.utc().subtract(15, 'minutes')
    let current = moment.utc()

    let start
    let end

    switch (frequency) {
        case constants.telegram.frequency.YEARLY:
            start = current_safe.startOf('year')
            end = current
            break
        case constants.telegram.frequency.MONTHLY:
            start = current_safe.startOf('month')
            end = current
            break
        case constants.telegram.frequency.WEEKLY:
            start = current_safe.startOf('isoWeek')
            end = current
            break
        case constants.telegram.frequency.LAST_YEAR:
            start = current_safe.startOf('year').subtract(1, 'year')
            end = current.startOf('year')
            break
        case constants.telegram.frequency.LAST_MONTH:
            start = current_safe.startOf('month').subtract(1, 'month')
            end = current.startOf('month')
            break
        case constants.telegram.frequency.LAST_WEEK:
            start = current_safe.startOf('week').subtract(1, 'week')
            end = current.startOf('week')
            break
        case constants.telegram.frequency.YESTERDAY:
            start = current_safe.startOf('day').subtract(1, 'day')
            end = current.startOf('day')
            break
        default:
            start = current_safe.startOf('day')
            end = current
            break
    }

    datetime.start = start.format('YYYY-MM-DD HH:mm:ss')
    datetime.end = end.format('YYYY-MM-DD HH:mm:ss')

    const duration = moment.duration(end.diff(start))

    const d = Math.floor(duration.asDays())
    const h = duration.hours()
    const m = duration.minutes()
    const s = duration.seconds()
    datetime.duration = (
        (d > 0 ? d + 'd ' : '') +
        (h > 0 ? h + 'h ' : '') +
        (m > 0 ? m + 'm ' : '') +
        (s > 0 ? s + 's ' : '')
    ).slice(0, -1)

    return datetime
}

const prettifyArray = (array, limit = false) => {
    let str = ''

    try {
        if (array.length > 0) {
            const num_chars = array[0].count.toString().length
            let count = 0

            for (let i = 0; i < array.length; i++) {
                str += `  <i>${' '.repeat(
                    (num_chars - array[i].count.toString().length) * 2
                )}${array[i].count}</i>   ${array[i].key}\n`
                count++
                if (limit && count >= limit) {
                    str += `  <i>${' '.repeat(num_chars * 2)}</i>   ...\n`
                    break
                }
            }
            str = str.slice(0, -1)
        }
    } catch (error) {
        console.log(JSON.stringify(error))
    }

    return str
}

const objectSort = (obj) => {
    let arr = []
    for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                key: prop,
                count: obj[prop],
            })
        }
    }
    arr.sort((a, b) => b.count - a.count)
    return arr
}

module.exports = {
    folderRequire,
    safeJsonParse,
    safePercentage,
    calcRangeDatetime,
    prettifyArray,
    objectSort
}
