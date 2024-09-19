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
	type ResourceOptions,
} from "solid-js"

export function useDocument<T>(
	id: () => AnyDocumentId | undefined,
	options?: {
		storage?: ResourceOptions<Doc<T>, DocHandle<T>>["storage"]
	}
): [
	Resource<Doc<T> | undefined>,
	(changeFn: ChangeFn<T>, options?: ChangeOptions<T> | undefined) => void,
] {
	let handle = useHandle<T>(id)
	let [doc, {refetch, mutate}] = createResource<
		Doc<T | undefined>,
		DocHandle<T>
	>(handle, handle => handle.doc(), {
		initialValue: handle()?.docSync(),
		storage: options?.storage,
	})

	createEffect(
		on(handle, handle => {
			handle?.on("change", refetch)
			handle?.on("delete", refetch)
			onCleanup(() => {
				handle?.off("change", refetch)
				handle?.off("delete", refetch)
			})
		})
	)

	createEffect(on(handle, handle => handle || mutate()))
	createEffect(on(id, id => id || mutate))

	return [
		doc,
		(fn: ChangeFn<T>, options?: ChangeOptions<T>) => {
			handle()?.change(fn, options)
		},
	]
}
