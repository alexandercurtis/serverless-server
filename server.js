const args = require('commander');
const yaml = require('js-yaml');
const fs = require('fs');
const http = require('http');
const url = require('url');

args
  .version('1.0.0')
  .option('-d, --directory [path]', 'Directory containing serverless.yml')
  .option('-a, --api [name]', 'Name of api (forms first part of route /api/stage/function')
  .option('-s, --stage [name]', 'Name of stage (forms second part of route /api/stage/function')
  .parse(process.argv);

let configFile = 'serverless.yml';
let path = '';
if (!fs.existsSync(path)) {
  if (!args.directory) {
    console.log('Please specify a directory containing serverless.yml:\n' + process.argv[0] + ' -d [directory]');
    process.exit(1);
  } else {
    path = args.directory;
    configFile = path + '/' + configFile;
    if (!fs.existsSync(configFile)) {
      console.log("Can't find " + configFile);
      process.exit(1);
    }
  }
}

let routePrefix = "/";
if (args.api) {
  routePrefix += args.api + "/";
}
if (args.stage) {
  routePrefix += args.stage + "/";
}

let routes = {};

try {
  const config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
  const functions = config['functions'];
  for (const f in functions) {
    if (config.functions[f].events) {
      for (const e in config.functions[f].events) {
        if (config.functions[f].events[e].http) {
          if (config.functions[f].events[e].http.path) {
            const handler = config.functions[f].handler.split('.');
            const route = routePrefix + config.functions[f].events[e].http.path;
            const handlerPath = path + '/' + handler[0];
            console.log(route + ": " + handlerPath);
            routes[route] = {
              handler: handler[1],
              file: handlerPath,
              method: config.functions[f].events[e].http.method,
              handlerFn: require(handlerPath)
            };
          }
        }

      }
    }
  }
} catch (e) {
  console.log(e);
  process.exit(2);
}

var server = http.createServer(function (request, response) {
  const requestUrl = url.parse(request.url);
  const route = routes[requestUrl.pathname];
  let queryStringParameters = {};

  if (route) {
    const query = requestUrl.query.split('&');
    for (const q in query) {
      const qi = query[q].indexOf('=');
      if (qi >= 0) {
        queryStringParameters[query[q].slice(0, qi)] = query[q].slice(qi + 1);
      }
    }

    const event = {
      queryStringParameters: queryStringParameters
    };
    const context = {};
    const callback = function (err, data) {
      if (err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.end("Internal Server Error.\n");
      } else {
        response.writeHead(200, {"Content-Type": "text/plain"});
        console.log(data);
        response.end(JSON.stringify(data) + "\n");
      }
    };
    route.handlerFn[route.handler](event, context, callback);
  } else {
    response.writeHead(404, {"Content-Type": "text/plain"});
    response.end("Not found.\n");
  }
});

server.listen(8000);

console.log("Server running at http://127.0.0.1:8000/");
