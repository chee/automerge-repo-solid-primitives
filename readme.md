# Solid Primitives for Automerge Repo

Helpers for using <a href="https://automerge.org/docs/repositories/">
<img alt="" src=.assets/automerge.png width=22 height=22>
Automerge
</a> with <a href="https://www.solidjs.com/">
<img alt="" src=.assets/solid.png width=22 height=22>
SolidJS
</a>.

## RepoContext

A convenience context for Automerge-Repo Solid apps. Optional: if you prefer you
can pass a repo as an option to `useHandle` or `useDocument`.

```tsx
<RepoContext.Provider repo={Repo}>
	<App />
</RepoContext.Provider>
```

## useRepo

Get the repo from the [context](#repocontext).

```ts
useRepo(): Repo
```

### e.g.

```ts
let repo = useRepo()
```

## useHandle

Get a [handle](https://automerge.org/docs/repositories/dochandles/) from the repo as a [resource](https://docs.solidjs.com/reference/basic-reactivity/create-resource).

```ts
useHandle<T>(
    () => AnyDocumentId,
    options?: {repo: Repo}
): Resource<Handle<T>>
```

### e.g.

```ts
let handle = useHandle(id)
// or
let handle = useHandle(id, {repo})
```

The `repo` option can be left out if you are using [RepoContext](#repocontext).

## useDocument

Get a document and change function from the repo as a [resource](https://docs.solidjs.com/reference/basic-reactivity/create-resource).

```ts
useDocument<T>(
    () => AnyDocumentId,
    options?: {repo: Repo}
): [Resource<T>, (fn: changeFn<T>) => void]
```

### e.g.

```ts
let [doc, change] = useDocument(id)
// or
let [doc, change] = useDocument(id, {repo})
```

The `repo` option can be left out if you are using [RepoContext](#repocontext).

## createDocumentStore

Create a store for a handle's document. It's subscribed to the handle's changes,
and converts incoming automerge operations to store updates, providing
fine-grained reactivity that's consistent across space and time.

```ts
createDocumentStore<T>(
    () => Handle<T>
): Resource<Doc<T>>
```

### e.g.

```ts
let handle = useHandle(id, {repo})
let doc = createDocumentStore(handle)

return <h1>{doc.items[1].title}</h1>
```
