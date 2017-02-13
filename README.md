# Serverless Server

A simple server to serve serverless lambdas, built for the Serverless framework. Useful for local testing and/or without an Internet connection.

Checks the CWD and the directory specified with the `-d` argument for a `serverless.yml` file, which it uses to establish the routes at which you can invoke your lambda functions.

You will need an existing Serverless project, complete with `serverless.yml`.

## Example Usage

Start server

    node server.js -d ../foo-services/foo-api -a foo -s dev

then navigate to

    http://127.0.0.1:8000/foo/dev/myservice?bar=baz

