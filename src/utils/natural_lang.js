const checkArray = (string, array) => {
    let pos = string.length
    let current_pos = -1
    let result = null

    for (let i = 0; i < array.length && pos > 0; i++) {
        current_pos = string.indexOf(array[i])
        if (current_pos !== -1 && current_pos < pos) {
            pos = current_pos
            result = array[i]
        }
    }

    return result
}

const checkArgs = (string, args) => {
    let result = {}
    const normalized_string = normalizeText(string)

    let current_arg = null

    for (const arg in args) {
        if (args.hasOwnProperty(arg)) {
            current_arg = checkArray(normalized_string, args[arg])
            if (current_arg !== null) {
                result[arg] = current_arg
            }
        }
    }

    return result
}

const checkName = (string, objects) => {
    const normalized_string = normalizeText(string)
    let pos = normalized_string.length
    let current_pos = -1
    let result

    result = checkArray(normalized_string, Object.keys(objects))

    if (result === null) {
        for (const object in objects) {
            if (objects.hasOwnProperty(object) && Array.isArray(objects[object].alias)) {
                for (let i = 0; i < objects[object].alias.length; i++) {
                    current_pos = normalized_string.indexOf(objects[object].alias[i])
                    if (current_pos !== -1 && current_pos < pos) {
                        pos = current_pos
                        result = object
                    }
                }
            }
        }
    }

    return result
}


const normalizeText = (string) => {
    return `${string}`.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^0-9a-z/ _-]/gi, '')
}


module.exports = {
    checkArray,
    checkArgs,
    checkName,
    normalizeText,
}
