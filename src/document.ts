import type {
	AnyDocumentId,
	ChangeFn,
	Doc,
	DocHandle,
} from "@automerge/automerge-repo/slim"
import type {ChangeOptions} from "@automerge/automerge/slim/next"

import {useHandle} from "./handle.ts"
import {
	createEffect,
	createResource,
	on,
	onCleanup,
	type Resource,
} from "solid-js"
import type {BaseOptions} from "./types.ts"

/**
 * Get a {@link Doc} from an AutomergeURL.
 */
export function useDocument<T>(
	id: () => AnyDocumentId | undefined,
	options?: BaseOptions
): [
	Resource<Doc<T> | undefined>,
	(changeFn: ChangeFn<T>, options?: ChangeOptions<T> | undefined) => void,
] {
	let handle = useHandle<T>(id, options)
	let [doc, {refetch, mutate}] = createResource<
		Doc<T | undefined>,
		DocHandle<T>
	>(handle, handle => handle.doc(), {
		initialValue: handle()?.docSync(),
	})

	function ondelete() {
		mutate()
		refetch()
	}

	createEffect(
		on(handle, handle => {
			handle?.on("change", refetch)
			handle?.on("delete", ondelete)
			onCleanup(() => {
				handle?.off("change", refetch)
				handle?.off("delete", ondelete)
			})
		})
	)

	createEffect(on(id, id => id || mutate()))

	return [
		doc,
		(fn: ChangeFn<T>, options?: ChangeOptions<T>) => {
			handle()?.change(fn, options)
		},
	]
}
