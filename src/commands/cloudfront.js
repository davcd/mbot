const aws = require('aws-sdk')
aws.config.update({region: process.env.ATHENA_AWS_REGION})

const AthenaExpress = require('athena-express')
const bowser = require('bowser')

const common = require('../utils/common')
const constants = require('../utils/constants')

const cloudfront_el = require('../utils/cloudfront_edge_locations.json')


const alias = ['web', 'website', 'aws_website']

const args = {
    frequency: [
        constants.telegram.frequency.DAILY,
        constants.telegram.frequency.WEEKLY,
        constants.telegram.frequency.MONTHLY,
        constants.telegram.frequency.YEARLY,
        constants.telegram.frequency.YESTERDAY,
        constants.telegram.frequency.LAST_WEEK,
        constants.telegram.frequency.LAST_MONTH,
        constants.telegram.frequency.LAST_YEAR,
    ],
    template: ['resume', 'extended'],
    athena_table: [process.env.ATHENA_TABLE_DEFAULT],
}

const args_default = {
    frequency: 'daily',
    template: 'extended',
    athena_table: process.env.ATHENA_TABLE_DEFAULT,
    athena_results_bucket: process.env.ATHENA_RESULTS_BUCKET,
    datetime: null,
}

const getCloudfrontInfoByAthena = async (args) => {
    let data = null

    try {
        const athena_query =
            `select * from default.${args.athena_table} where date_parse(concat(cast("date" as varchar(10)), ' ', "time"), '%Y-%m-%d %H:%i:%s')` +
            `between date_parse('${args.datetime.start}', '%Y-%m-%d %H:%i:%s') ` +
            `and date_parse('${args.datetime.end}', '%Y-%m-%d %H:%i:%s') ` +
            `order by "date" desc, "time" desc;`

        const athena_express = new module.exports.AthenaExpress({
            aws,
            s3: args.athena_results_bucket,
        })
        data = athena_express.query(athena_query)
    } catch (error) {
        console.log(JSON.stringify(error))
    }
    return data
}

const groupBySingleKey = (items, key) =>
    items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: (result[item[key]] || 0) + 1,
        }),
        {}
    )

const groupByDoubleKey = (items, key) =>
    items.reduce(
        (result, item) => ({
            ...result,
            [item[key[0]][key[1]]]: (result[item[key[0]][key[1]]] || 0) + 1,
        }),
        {}
    )

const groupByLocation = (items) =>
    items.reduce(
        (result, item) => ({
            ...result,
            [item['location'].substring(0, 3)]:
            (result[item['location'].substring(0, 3)] || 0) + 1,
        }),
        {}
    )

const translateLocations = (array) => {
    for (let i = 0; i < array.length; i++) {
        let node = cloudfront_el.nodes[array[i].key]
        array[i].key = node.country + ' - ' + node.city
    }
    return array
}

const formatUris = (array) => {
    for (let i = 0; i < array.length; i++) {
        array[i].key = '/' + array[i].key
    }
    return array
}


const buildMessage = (data, args) => {
    let content = ''

    try {
        content +=
            `<b>${args.athena_table} - cloudfront traffic report</b>` +
            `\n\n<pre>Information</pre>` +
            `\n •  Frequency: <i>${args.frequency}</i>` +
            `\n •  From: <i>${args.datetime.start}</i>` +
            `\n •  To: <i>${args.datetime.end}</i>` +
            `\n •  Total time: <i>${args.datetime.duration}</i>`

        const count = data.Items.length

        if (count === 0) {
            return {
                type: constants.types.HTML,
                content: content + '\n\n<b>No data found</b>',
            }
        }

        const unique = [...new Set(data.Items.map(({request_ip}) => request_ip))].length

        const crawlers = data.Items.reduce((sum, {user_agent}) => {
            if (user_agent.match(
                /(?:\/[A-Za-z0-9.]+)? *([A-Za-z0-9 \-_![\]:]*(?:[Aa]rchiver|[Ii]ndexer|[Ss]craper|[Bb]ot|[Ss]pider|[Cc]rawl[a-z]*))/gm
            )) {
                sum++
            }
            return sum
        }, 0)

        const bytes = data.Items.reduce((sum, {bytes}) => sum + parseInt(bytes, 10), 0)
            .toString()
            .replace(/(?!^)(?=(?:\d{3})+(?:\.|$))/gm, ' ')

        const status = data.Items.reduce((obj, {status}) => {
            if (status > 199 && status < 300) {
                obj._2xx++
            } else if (status > 299 && status < 400) {
                obj._3xx++
            } else if (status > 399 && status < 500) {
                obj._4xx++
            } else if (status > 499 && status < 600) {
                obj._5xx++
            }
            return obj
        }, {_2xx: 0, _3xx: 0, _4xx: 0, _5xx: 0})

        const protocol = data.Items.reduce((obj, {request_protocol}) => ({
            ...obj,
            [request_protocol]: obj[request_protocol] + 1
        }), {http: 0, https: 0})

        content +=
            `\n\n<pre>Overall metrics</pre>` +
            `\n •  <i>${count}</i> requests` +
            `\n •  <i>${unique}</i> unique ips` +
            `\n •  <i>${crawlers}</i> crawlers` +
            `\n •  <i>${bytes}</i> bytes transferred` +
            `\n •  Status ok: <i>${common.safePercentage(status._2xx, count, 1)}%</i> 2xx ` +
            `| <i>${common.safePercentage(status._3xx, count, 1)}%</i> 3xx` +
            `\n •  Status ko: <i>${common.safePercentage(status._4xx, count, 1)}%</i> 4xx` +
            `| <i>${common.safePercentage(status._5xx, count, 1)}%</i> 5xx` +
            `\n •  Protocol: <i>${protocol.http}</i> http | <i>${protocol.https}</i> https`

        if (args.template === 'resume') {
            return {
                type: constants.types.HTML,
                content,
            }
        }

        const array_referrers = common.objectSort(groupBySingleKey(data.Items, 'referrer'))
        const array_uris = formatUris(common.objectSort(groupBySingleKey(data.Items, 'uri')))
        const array_result_types = common.objectSort(groupBySingleKey(data.Items, 'result_type'))

        const array_locations = translateLocations(common.objectSort(groupByLocation(data.Items)))

        const array_ua = data.Items.map(({user_agent}) =>
            bowser.getParser(decodeURI(decodeURI(user_agent))).getResult()
        )

        const array_Browsers = common.objectSort(groupByDoubleKey(array_ua, ['browser', 'name']))
        const array_os = common.objectSort(groupByDoubleKey(array_ua, ['os', 'name']))
        const array_platform = common.objectSort(groupByDoubleKey(array_ua, ['platform', 'type']))

        content +=
            `\n\n<pre>Top Referrers</pre>` +
            `\n${common.prettifyArray(array_referrers, 15)}` +
            `\n\n<pre>Popular objects</pre>` +
            `\n${common.prettifyArray(array_uris, 10)}` +
            `\n\n<pre>Cache statistics</pre>` +
            `\n${common.prettifyArray(array_result_types, 5)}` +
            `\n\n<pre>Viewers edge location</pre>` +
            `\n${common.prettifyArray(array_locations, 10)}` +
            `\n\n<pre>Viewers browser</pre>` +
            `\n${common.prettifyArray(array_Browsers, 10)}` +
            `\n\n<pre>Viewers os</pre>` +
            `\n${common.prettifyArray(array_os, 10)}` +
            `\n\n<pre>Viewers platform</pre>` +
            `\n${common.prettifyArray(array_platform, 5)}`
    } catch (error) {
        console.log(JSON.stringify(error))
    }

    return {
        type: constants.types.HTML,
        content,
    }
}

const execute = async flow => {
    let result = []

    try {
        let args = {
            ...args_default,
            ...flow.command.args,
        }
        args.datetime = common.calcRangeDatetime(args.frequency)

        const data = await getCloudfrontInfoByAthena(args)

        if (data !== null) {
            result.push(buildMessage(data, args))
        }
    } catch (error) {
        console.log(JSON.stringify(error))
    }
    return result
}

module.exports = {
    args,
    args_default,
    alias,
    execute,
    getCloudfrontInfoByAthena,
    buildMessage,
    AthenaExpress
}
