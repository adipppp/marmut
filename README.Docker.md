### Building and running your application

When you are ready, start your application by running:

`docker compose up --build`

This project now runs without a local database container.

### Deploying your application to the cloud

Build your image:

`docker build -t myapp .`

If your cloud uses a different CPU architecture than your development machine,
build for that platform:

`docker build --platform=linux/amd64 -t myapp .`

Then push it to your registry:

`docker push myregistry.com/myapp`
