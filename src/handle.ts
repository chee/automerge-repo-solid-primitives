import type {AnyDocumentId, DocHandle} from "@automerge/automerge-repo/slim"
import {RepoContext} from "./repo.ts"
import {
	createEffect,
	createResource,
	on,
	useContext,
	type Resource,
} from "solid-js"
import type {BaseOptions} from "./types.ts"

/**
 * Get a {@link DocHandle} from an AutomergeURL.
 */
export function useHandle<T>(
	id: () => AnyDocumentId | undefined,
	options?: BaseOptions
): Resource<DocHandle<T> | undefined> {
	let contextRepo = useContext(RepoContext)
	if (!options?.repo && !contextRepo) {
		throw new Error("use outside <RepoContext> requires options.repo")
	}
	let repo = (options?.repo || contextRepo)!
	let [handle, {mutate}] = createResource(id, id => {
		if (!id) return
		let handle = repo.find<T>(id)
		if (handle.isReady()) return handle
		return handle.whenReady().then(() => handle)
	})
	createEffect(on(id, id => id || mutate()))
	return handle
}
