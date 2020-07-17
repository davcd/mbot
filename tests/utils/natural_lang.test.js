const natural_lang = require('../../src/utils/natural_lang')


describe('Check array', () => {

    test('Matches exactly one time', () => {
        const string = 'test'
        const array = ['test', 'qwe', 'rty']

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual('test')
    })

    test('Matches exactly multiple times', () => {
        const string = 'test'
        const array = ['test', 'qwe', 'rty', 'test', 'test']

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual('test')
    })

    test('Matches contained one time', () => {
        const string = 'astestd'
        const array = ['test', 'qwe', 'rty']

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual('test')
    })

    test('Matches contained multiple times', () => {
        const string = 'testasd'
        const array = ['asd', 'qwe', 'rty', 'test']

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual('test')
    })

    test('Not matches', () => {
        const string = 'test'
        const array = ['tesdt', 'qwe']

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual(null)
    })

    test('Empty array', () => {
        const string = 'test'
        const array = []

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual(null)
    })

    test('Empty string', () => {
        const string = ''
        const array = ['tesdt', 'qwe']

        const result = natural_lang.checkArray(string, array)
        expect(result).toStrictEqual(null)
    })

})

describe('Check args', () => {

    test('Matches one arg', () => {
        const string = 'test'
        const args = {
            arg1: ['test', 'qwe', 'rty'],
            arg2: ['asd', 'fgh']
        }

        const result = natural_lang.checkArgs(string, args)
        expect(result).toStrictEqual({arg1: 'test'})
    })

    test('Args object has not own property', () => {
        const string = 'test'
        const args = Object.create({
            arg1: ['test', 'qwe', 'rty']
        })

        const result = natural_lang.checkArgs(string, args)
        expect(result).toStrictEqual({})
    })

    test('Empty args', () => {
        const string = 'test'
        const args = {}

        const result = natural_lang.checkArgs(string, args)
        expect(result).toStrictEqual({})
    })

    test('Empty string', () => {
        const string = ''
        const args = {
            arg1: ['test', 'qwe', 'rty'],
            arg2: ['asd', 'fgh']
        }

        const result = natural_lang.checkArgs(string, args)
        expect(result).toStrictEqual({})
    })

})


describe('Check name', () => {

    test('Name matches exactly one time', () => {
        const string = 'test'
        const objects = {
            test: {alias: []},
            asd: {alias: []}
        }

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual('test')
    })

    test('Name matching has priority over alias matching', () => {
        const string = 'qwetest'
        const objects = {
            test: {alias: []},
            asd: {alias: ['qwe']}
        }

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual('test')
    })

    test('Alias matches contained', () => {
        const string = 'qwerty'
        const objects = {
            test: {alias: []},
            asd: {alias: ['qwe']}
        }

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual('asd')
    })

    test('Empty alias', () => {
        const string = 'qwerty'
        const objects = {
            test: {alias: []}
        }

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual(null)
    })

    test('Non existing alias', () => {
        const string = 'qwerty'
        const objects = {
            test: {}
        }

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual(null)
    })

    test('Empty objects', () => {
        const string = 'qwerty'
        const objects = {}

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual(null)
    })

    test('Empty string', () => {
        const string = ''
        const objects = {
            test: {alias: ['asd']}
        }

        const result = natural_lang.checkName(string, objects)
        expect(result).toStrictEqual(null)
    })

})

describe('Normalize text', () => {

    test('To lowercase', () => {
        const string = 'QwErTy'

        const result = natural_lang.normalizeText(string)

        expect(result).toStrictEqual('qwerty')
    })

    test('Normalize characters', () => {
        const string = 'aåbîįçñnń'

        const result = natural_lang.normalizeText(string)

        expect(result).toStrictEqual('aabiicnnn')
    })

    test('Limited characters', () => {
        const string = '1ab?+ c&_-/^@™'

        const result = natural_lang.normalizeText(string)

        expect(result).toStrictEqual('1ab c_-/')
    })

})