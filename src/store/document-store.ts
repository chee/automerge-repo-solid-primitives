import {
	createEffect,
	createResource,
	getOwner,
	onCleanup,
	runWithOwner,
} from "solid-js"
import type {
	AnyDocumentId,
	ChangeFn,
	Doc,
	DocHandle,
	DocHandleChangePayload,
} from "@automerge/automerge-repo"
import type {Accessor} from "solid-js"
import {createStore, produce, type Store} from "solid-js/store"
import type {Patch} from "@automerge/automerge"
import {apply, fromAutomerge} from "cabbages"
import type {BaseOptions} from "../types.ts"
import {useHandle} from "../handle.ts"

export type DocumentStore<T> = [Store<Doc<T>>, (fn: ChangeFn<T>) => void]

export function autoproduce<T>(patches: Patch[]) {
	return produce<T>(doc => {
		for (let patch of patches) {
			const [path, range, val] = fromAutomerge(patch)
			apply(path, doc, range, val)
		}
	})
}

export function createDocumentStore<T>(
	handle: Accessor<DocHandle<T> | undefined>
) {
	let owner = getOwner()

	let [document] = createResource<Doc<T>, DocHandle<T>>(
		handle,
		async handle => {
			await handle.whenReady()
			let [document, update] = createStore(handle.docSync() as Doc<T>)

			function patch(payload: DocHandleChangePayload<T>) {
				update(autoproduce(payload.patches))
			}

			handle.on("change", patch)
			runWithOwner(owner, () => onCleanup(() => handle.off("change", patch)))
			return document
		},
		{
			initialValue: handle()?.docSync(),
		}
	)

	return document
}

export function useDocumentStore<T>(
	id: () => AnyDocumentId | undefined,
	options?: BaseOptions
) {
	let handle = useHandle<T>(id, options)
	let doc = createDocumentStore<T>(handle)
	let queue: ChangeFn<T>[] = []
	createEffect(() => {
		if (handle()) {
			let next
			while ((next = queue.shift())) {
				handle()?.change(next)
			}
		} else {
			queue = []
		}
	})
	return [
		doc,
		(fn: ChangeFn<T>) => {
			if (handle()?.isReady) {
				handle()!.change(fn)
			} else {
				queue.push(fn)
			}
		},
	] as const
}
