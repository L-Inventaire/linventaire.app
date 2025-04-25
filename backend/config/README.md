This folder contains the configuration of the application.

Typically, development.json will be gitignored and a productioin.json is present on the server.

Notice the content of development.json is smaller than the default.json, that's because all the configuration are merged depending on the NODE_ENV environment variable.

For instance if the env variables are the following: `NODE_ENV=development SERVER_PORT=5000`

- First the default.json is loaded
- Then the development.json is loaded and merged with the default.json because the NODE_ENV is development
- Then the env SERVER_PORT override the port as mapped in custom-environment-variables.json
