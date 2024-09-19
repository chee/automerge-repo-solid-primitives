# Solid Primitives for Automerge Repo

These hooks are provided as helpers for using Automerge in your SolidJS project.

## `<RepoProvider repo={Repo}/>`

Wrapper context required in Automerge-Repo Solid apps

## `useRepo(): Repo`

Get a the current repo from the context.

## `useHandle<T>(() => AnyDocumentId): Resource<Handle>`

Get a handle from the repo.

## `useDocument<T>(() => AnyDocumentId): [Resource<T>, (fn: changeFn<T>) => void]`

Get a document and change function from the repo.

## `createDocumentStore<T>(() => Handle<T>): Resource<Doc<T>>`

Create a store for a handle's document. We subscribe to the handle's changes,
and apply the incoming patches to the precise the fields of the store that have
changed to provide fine-grained reactivity that's consistent across space and
time.
