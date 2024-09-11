import {onCleanup, onMount} from "solid-js"
import type {
	ChangeFn,
	Doc,
	DocHandle,
	DocHandleChangePayload,
	Prop,
} from "@automerge/automerge-repo"
import type {Accessor} from "solid-js"
import {createStore, produce, type Store} from "solid-js/store"
import type {Patch} from "@automerge/automerge"
import {apply, fromAutomerge} from "cabbages"

export type HandleStore<T> = [Store<Doc<T>>, (fn: ChangeFn<T>) => void]

export function createDocumentStore<T>(
	handle: Accessor<DocHandle<T> | undefined>
): HandleStore<T> {
	if (!handle()?.isReady()) {
		throw new Error("please wait until the handle is ready!!!")
	}

	let [document, updateDocumentStore] = createStore(
		handle()!.docSync() as Doc<T>
	)

	function change(fn: ChangeFn<T>) {
		handle()!.change(fn)
	}

	function patch(payload: DocHandleChangePayload<T>) {
		updateDocumentStore(autoproduce(payload.patches))
	}

	onMount(() => {
		handle()?.on("change", patch)
	})

	onCleanup(() => {
		handle()?.off("change", patch)
	})

	return [document, change]
}

function autoproduce<T>(patches: Patch[]) {
	return produce<T>(doc => {
		for (let patch of patches) {
			const [path, range, val] = fromAutomerge(patch)
			apply(path, doc, range, val)
		}
	})
}
