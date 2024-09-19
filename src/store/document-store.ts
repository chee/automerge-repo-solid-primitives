import {createResource, getOwner, onCleanup, runWithOwner} from "solid-js"
import type {
	ChangeFn,
	Doc,
	DocHandle,
	DocHandleChangePayload,
} from "@automerge/automerge-repo"
import type {Accessor, ResourceOptions} from "solid-js"
import {createStore, produce, type Store} from "solid-js/store"
import type {Patch} from "@automerge/automerge"
import {apply, fromAutomerge} from "cabbages"

export type DocumentStore<T> = [Store<Doc<T>>, (fn: ChangeFn<T>) => void]

function autoproduce<T>(patches: Patch[]) {
	return produce<T>(doc => {
		for (let patch of patches) {
			const [path, range, val] = fromAutomerge(patch)
			apply(path, doc, range, val)
		}
	})
}

export interface DocumentStoreOptions<T> {
	storage?: ResourceOptions<Doc<T>, DocHandle<T>>["storage"]
}

export function createDocumentStore<T>(
	handle: Accessor<DocHandle<T> | undefined>,
	options?: DocumentStoreOptions<T>
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
			storage: options?.storage,
		}
	)

	return document
}
