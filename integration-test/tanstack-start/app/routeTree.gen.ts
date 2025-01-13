/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as LoaderDeferImport } from './routes/loader-defer'

// Create/Update Routes

const LoaderDeferRoute = LoaderDeferImport.update({
  id: '/loader-defer',
  path: '/loader-defer',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/loader-defer': {
      id: '/loader-defer'
      path: '/loader-defer'
      fullPath: '/loader-defer'
      preLoaderRoute: typeof LoaderDeferImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/loader-defer': typeof LoaderDeferRoute
}

export interface FileRoutesByTo {
  '/loader-defer': typeof LoaderDeferRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/loader-defer': typeof LoaderDeferRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/loader-defer'
  fileRoutesByTo: FileRoutesByTo
  to: '/loader-defer'
  id: '__root__' | '/loader-defer'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  LoaderDeferRoute: typeof LoaderDeferRoute
}

const rootRouteChildren: RootRouteChildren = {
  LoaderDeferRoute: LoaderDeferRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/loader-defer"
      ]
    },
    "/loader-defer": {
      "filePath": "loader-defer.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
