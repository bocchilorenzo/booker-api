import libgen from "libgen";
const { search: _search } = libgen;
import sanitize from "sanitize-filename";
import Fastify from "fastify";
import cors from "@fastify/cors";

const fastify = Fastify({
  logger: true,
});
await fastify.register(cors, {
  origin: ["https://booker.vercel.app", "http://localhost:3000"],
  methods: ["GET"],
});

function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

async function search(settings) {
  try {
    const data = await _search(settings);
    let n = data.length;
    let toRtn = { status: 404, results: [] };
    if (n != 0) {
      toRtn.status = 200;
      let coverId = "";
      while (n--) {
        coverId = data[n].id;
        if (coverId.length >= 4) {
          for (let i = coverId.length - 1; i > coverId.length - 4; i--) {
            coverId = setCharAt(coverId, i, "0");
          }
        } else {
          coverId = "0";
        }
        toRtn.results.push({
          id: data[n].id,
          title: data[n].title,
          author: data[n].author,
          mirrors: ["https://libgen.is", "https://libgen.st"],
          link: "/book/index.php?md5=" + data[n].md5.toLowerCase(),
          cover: "/covers/" + data[n].coverurl,
          extension: data[n].extension,
          size: data[n].filesize,
          language: data[n].language,
          pages: data[n].pages,
          year: data[n].year,
        });
      }
    }
    return toRtn;
  } catch (err) {
    console.log(err);
    return { status: 500, results: [] };
  }
}

fastify.addHook("onSend", async (request, reply, payload) => {
  if (!reply.hasHeader("Access-Control-Allow-Origin")) {
    reply.header("Access-Control-Allow-Origin", "https://booker.vercel.app");
    reply.header("Access-Control-Allow-Methods", "GET");
    reply.header("Access-Control-Allow-Headers", "Content-Type");
  }
  return payload;
});

fastify.get("/search", async function (request, reply) {
  if (request.query.q && request.query.q != "") {
    let options = {
      mirror: "https://libgen.is",
      query: "",
      count: 20,
      sort_by: "def",
      reverse: false,
    };
    options.query = sanitize(request.query.q);
    let result = await search(options);
    reply.send(result);
  } else {
    reply.send({ status: 200, error: "Invalid query" });
  }
});

fastify.get("/wake", async function (request, reply) {
  reply.send({ status: 200, msg: "Server active" });
});

async function start() {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
