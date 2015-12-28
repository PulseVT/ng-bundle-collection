# ng-bundle-collection

A handy [Restangular](https://github.com/mgonto/restangular)-oriented AngularJS plugin for comfortable work with collections.

# Features

- interaction with API
- CRUD for collection items
- single source of truth for data in your app
- caching
- requests consolidation - if collection got the same request which is currently pending, it will be bound to promise of already pending request. This helps to avoid sending identical requests before the response is cached. This will work also if caching is off
- intercepting, extending, modifying, replacing responses from backend
- non-backend work mode (as a collection of local items)
- mocking of responses (for debugging or development without backend)

# API

Please watch documentation [here](http://pulsevt.github.io/ng-bundle-collection/), under `Docs` tab

# Build & Serve
## Comprehensive
To build, serve example and documentation, run

> grunt

Which is the same as

> grunt serve

Example + docs is served at `localhost:9000` (switch using navbar)

Pure Documentation is served at `localhost:9001`

## Only documentation

This builds and serves documentation at `localhost:9001`:

> grunt serve-docs

This builds documentation in `docs` folder

> grunt docs

## Only example

This builds and serves example on `localhost:9000`

> grunt serve-examples

# License

[MIT](http://opensource.org/licenses/MIT) © Vitaliy Tarash <vitaliy.tarash@gmail.com>