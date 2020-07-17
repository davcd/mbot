const constants = require('../utils/constants')

const alias = ['hola', 'salut', 'hallo', 'ciao', 'hey']

const args = {}

const hello = ["Hola", "Hello", "Salut", "Ciao", "Hallo", "Priviet", "Ni Hao", "Olá"]

const execute = async () => {
    return [{
        type: constants.types.STRING,
        content: hello[Math.floor(Math.random() * hello.length)]
    }]
}

module.exports = {
    args,
    alias,
    execute,
}
