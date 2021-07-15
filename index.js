var libgen = require("libgen");
var sanitize = require("sanitize-filename");

const fastify = require('fastify')({
    logger: true
})

let options = {
    mirror: 'https://libgen.is',
    query: '',
    count: 20,
    sort_by: 'def',
    reverse: false
}

function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}

async function search(settings) {
    try {
        const data = await libgen.search(settings)
        let n = data.length
        let toRtn = { response: 404, results: [] }
        if (n != 0) {
            toRtn.response = 200
            let coverId = ""
            while (n--) {
                coverId = data[n].id
                if (coverId.length >= 4) {
                    for (let i = coverId.length - 1; i > coverId.length - 4; i--) {
                        coverId = setCharAt(coverId, i, "0")
                    }
                }
                else {
                    coverId = "0"
                }
                toRtn.results.push({
                    id: data[n].id,
                    title: data[n].title,
                    author: data[n].author,
                    mirrors: ["https://libgen.is", "http://gen.lib.rus.ec"],
                    link: "/book/index.php?md5=" + data[n].md5.toLowerCase(),
                    cover: "/covers/" + data[n].coverurl,
                    extension: data[n].extension,
                    size: data[n].filesize,
                    language: data[n].language,
                    pages: data[n].pages,
                    year: data[n].year
                })
            }
        }
        return toRtn
    } catch (err) {
        return { response: 500, results: [] }
    }
}

fastify.get('/search', async function (request, reply) {
    reply.header("Access-Control-Allow-Origin", "https://booker.vercel.app");
    reply.header("Access-Control-Allow-Methods", "GET");
    if (request.query.q && request.query.q != "") {
        options.query = sanitize(request.query.q)
        let result = await search(options)
        reply.send(result)
    }
    else {
        reply.send({ status: 200, error: "Invalid query" })
    }
})

fastify.listen(process.env.PORT, '0.0.0.0', function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    fastify.log.info(`server listening on ${address}`)
})