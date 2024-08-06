Solid Primitives for Automerge Repo
===================================

These hooks are provided as helpers for using Automerge in your Solid project.

`<RepoProvider repo={Repo}/>`
-----------------------------
Wrapper context required in Automerge-Repo Solid apps

`useRepo(): Repo`
-----------------
Get a the current repo from the context.

`useHandle<T>(() => AnyDocumentId): Resource<Handle>`
-----------------------------------------------------
Get a handle from the repo.

`useDocument<T>(() => AnyDocumentId): [Resource<T>, (fn: changeFn<T>) => void]`
-------------------------------------------------------------------------------
Get a document and change function from the repo.
