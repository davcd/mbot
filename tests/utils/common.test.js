const common = require('../../src/utils/common')

const constants = require('../../src/utils/constants')

const mockdate = require('mockdate')


beforeEach(() => {
    console.log.mockClear()
})

test('Folder require', () => {
    const result = common.folderRequire('./src/utils/cloudfront_edge_locations.json')
    expect(result).toStrictEqual(expect.objectContaining({
        cloudfront_edge_locations: expect.any(Object)
    }))
})

describe('Safe json parse', () => {

    test('Valid json', () => {
        const string = '{"test": 12}'

        const result = common.safeJsonParse(string)
        expect(result).toStrictEqual({test: 12})
    })

    test('Non valid json', () => {
        const string = '{"test": 12'

        const result = common.safeJsonParse(string)
        expect(result).toStrictEqual(false)
    })

})

describe('Safe percentage', () => {

    test('Number is 0', () => {
        const number = 0
        const total = 20
        const decimals = 2

        const result = common.safePercentage(number, total, decimals)
        expect(result).toStrictEqual(0)
    })

    test('Result is integer', () => {
        const number = 10
        const total = 20
        const decimals = 4

        const result = common.safePercentage(number, total, decimals)
        expect(result).toStrictEqual(50)
    })

    test('Result is decimal', () => {
        const number = 2.5
        const total = 20
        const decimals = 4

        const result = common.safePercentage(number, total, decimals)
        expect(result).toStrictEqual('12.5000')
    })

})

describe('Range datetime', () => {

    afterAll(() => {
        mockdate.reset()
    })

    test('Frequency is daily', () => {
        mockdate.set(1577793600000)

        const frequency = constants.telegram.frequency.DAILY
        frequencyIsDaily(frequency)
    })

    test('Frequency is wrong', () => {
        mockdate.set(1577793600000)

        frequencyIsDaily('wrong_frequency')
    })

    const frequencyIsDaily = (frequency) => {
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-31 12:00:00')
        expect(result.start).toStrictEqual('2019-12-31 00:00:00')
        expect(result.duration).toStrictEqual('12h')
    }

    test('Frequency is weekly', () => {
        mockdate.set(1577783600000)

        const frequency = constants.telegram.frequency.WEEKLY
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-31 09:13:20')
        expect(result.start).toStrictEqual('2019-12-30 00:00:00')
        expect(result.duration).toStrictEqual('1d 9h 13m 20s')
    })

    test('Frequency is monthly', () => {
        mockdate.set(1577793600000)

        const frequency = constants.telegram.frequency.MONTHLY
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-31 12:00:00')
        expect(result.start).toStrictEqual('2019-12-01 00:00:00')
        expect(result.duration).toStrictEqual('30d 12h')
    })

    test('Frequency is yearly', () => {
        mockdate.set(1577783600000)

        const frequency = constants.telegram.frequency.YEARLY
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-31 09:13:20')
        expect(result.start).toStrictEqual('2019-01-01 00:00:00')
        expect(result.duration).toStrictEqual('364d 9h 13m 20s')
    })

    test('Frequency is yesterday', () => {
        mockdate.set(1577783600000)

        const frequency = constants.telegram.frequency.YESTERDAY
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-31 00:00:00')
        expect(result.start).toStrictEqual('2019-12-30 00:00:00')
        expect(result.duration).toStrictEqual('1d')
    })

    test('Frequency is last week', () => {
        mockdate.set(1577783600000)

        const frequency = constants.telegram.frequency.LAST_WEEK
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-29 00:00:00')
        expect(result.start).toStrictEqual('2019-12-22 00:00:00')
        expect(result.duration).toStrictEqual('7d')
    })

    test('Frequency is last month', () => {
        mockdate.set(1577783600000)

        const frequency = constants.telegram.frequency.LAST_MONTH
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-12-01 00:00:00')
        expect(result.start).toStrictEqual('2019-11-01 00:00:00')
        expect(result.duration).toStrictEqual('30d')
    })

    test('Frequency is last year', () => {
        mockdate.set(1577783600000)

        const frequency = constants.telegram.frequency.LAST_YEAR
        const result = common.calcRangeDatetime(frequency)

        expect(result.end).toStrictEqual('2019-01-01 00:00:00')
        expect(result.start).toStrictEqual('2018-01-01 00:00:00')
        expect(result.duration).toStrictEqual('365d')
    })

})

describe('Prettify array', () => {

    const array = [
        {key: 'a', count: 1500},
        {key: 'b', count: 80},
        {key: 'c', count: 20},
        {key: 'd', count: 5}
    ]

    test('Prettify array without limit', () => {
        const result = common.prettifyArray(array)
        const result_array = result.split('\n')

        expect(result).toStrictEqual(expect.any(String))
        expect(result_array.length).toStrictEqual(array.length)
        expect(prettyCheck(result_array)).toStrictEqual(true)
    })

    test('Prettify array with limit', () => {
        const result = common.prettifyArray(array, 2)
        const result_array = result.split('\n')

        expect(result).toStrictEqual(expect.any(String))
        expect(result).toContain('...')
        expect(result_array.length).toStrictEqual(2 + 1)
        expect(prettyCheck(result_array)).toStrictEqual(true)
    })

    test('Empty array', () => {
        const result = common.prettifyArray([], false)
        expect(result).toStrictEqual('')
        expect(console.log).not.toHaveBeenCalled()
    })

    test('Wrong array', () => {
        const result = common.prettifyArray([1, 2, 3], false)
        expect(result).toStrictEqual('')
        expect(console.log).toHaveBeenCalled()
    })

    const prettyCheck = (array) => {
        const aux = []

        for (let j = 0; j < array.length; j++) {
            let row = array[j]
            const i = row.substring(
                row.lastIndexOf("<i>") + 3,
                row.lastIndexOf("</i>")
            )
            const spaces = i.match(/ /g)
            aux[0] = i.length + (spaces !== null ? spaces.length : 0)
        }

        return aux.every((val, i, arr) => val === arr[0])
    }

})


describe('Object sort', () => {

    test('Ok', () => {
        const obj = {
            a: 1,
            b: 13,
            c: 5
        }
        const result = common.objectSort(obj)
        expect(result).toStrictEqual([
            {count: 13, key: 'b'},
            {count: 5, key: 'c'},
            {count: 1, key: 'a'},
        ])
    })

    test('Object has not own property', () => {
        const obj = Object.create({
            a: 2,
            b: 123,
            c: 54
        })
        const result = common.objectSort(obj)
        expect(result).toStrictEqual([])
    })


    test('Empty object', () => {
        const result = common.objectSort({})
        expect(result).toStrictEqual([])
    })

})
