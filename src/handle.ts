import type {AnyDocumentId, DocHandle} from "@automerge/automerge-repo/slim"
import {useRepo} from "./repo.ts"
import {createEffect, createResource, on, type Resource} from "solid-js"

// todo is this complicated for no reason?
// should i just return the result of repo.find(id())?

/** A hook which returns a {@link DocHandle} identified by a URL.
 *
 * @remarks
 * This requires a {@link RepoContext} to be provided by a parent component.
 */
export function useHandle<T>(
	id: () => AnyDocumentId | undefined
): Resource<DocHandle<T> | undefined> {
	let repo = useRepo()

	let [handle, {mutate}] = createResource(id, id => {
		if (!id) {
			return
		}
		let handle = repo.find<T>(id)

		if (handle.isReady()) {
			return handle
		}
		return handle.whenReady().then(() => handle)
	})

	createEffect(
		on([id], () => {
			if (!id()) {
				mutate()
			}
		})
	)

	return handle
}
