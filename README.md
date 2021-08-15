# Certificates Serveless

This is a project from Rocketseat Ignite Node.js bootcamp that uses serverless functions to generate course certificates.

## How to run

### Using vscode devcontaienr

- build the container;
- run `yarn db:start`;
- run `yarn app:start`.

### On local machine

You may need to install some dependencies:
- `apt-get update && apt-get install default-jre libgtk-3-0 libgbm-dev`

Then: 
- run `yarn install && yarn add -g serverless` or npm equivalent;
- run `sls dynamodb install` to install dynamodb;
- run `yarn db:start`;
- run `yarn app:start`.

## Endpoints

### generate-certificate (POST)

- dev: /dev/generate-certificate
- prod: /generate-certificate

With JSON body containing: 
`{
  "id": "user-id",
  "name": "username",
  "grade": "9.0"
}`

### verify-certificate (GET)

- dev: /dev/generate-certificate/{id}
- prod: /generate-certificate/{id}

With {id} being the user id.

## Deploying to AWS

- create a .env file like the .env.example;
- run yarn deploy.
