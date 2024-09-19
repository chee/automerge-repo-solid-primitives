import {AutomergeUrl, PeerId, Repo} from "@automerge/automerge-repo"
import {render, waitFor} from "@solidjs/testing-library"
import {describe, expect, it, vi} from "vitest"
import {useDocument} from "../src/document.ts"
import {RepoContext} from "../src/repo.ts"
import {createEffect, createSignal, on, type ParentComponent} from "solid-js"

const SLOW_DOC_LOAD_TIME_MS = 1

describe("useDocument", () => {
	function setup() {
		const repo = new Repo({
			peerId: "bob" as PeerId,
		})

		const handleA = repo.create<ExampleDoc>()
		handleA.change(doc => (doc.foo = "A"))

		const handleB = repo.create<ExampleDoc>()
		handleB.change(doc => (doc.foo = "B"))

		const handleSlow = repo.create<ExampleDoc>()
		handleSlow.change(doc => (doc.foo = "slow"))
		const oldDoc = handleSlow.doc.bind(handleSlow)
		let loaded = false
		const delay = new Promise(resolve =>
			setTimeout(() => {
				loaded = true
				resolve(true)
			}, SLOW_DOC_LOAD_TIME_MS)
		)
		handleSlow.doc = async () => {
			await delay
			const result = await oldDoc()
			return result
		}

		const oldDocSync = handleSlow.docSync.bind(handleSlow)
		handleSlow.docSync = () => {
			return loaded ? oldDocSync() : undefined
		}

		const wrapper: ParentComponent = props => {
			return (
				<RepoContext.Provider value={repo}>
					{props.children}
				</RepoContext.Provider>
			)
		}

		return {
			repo,
			handleA,
			handleB,
			handleSlow,
			wrapper,
		}
	}

	const Component = (props: {
		url: AutomergeUrl | undefined
		onDoc: (doc: ExampleDoc) => void
	}) => {
		const [doc] = useDocument<ExampleDoc>(() => props.url)
		createEffect(
			on([doc], ([doc]) => {
				props.onDoc(doc!)
			})
		)
		return null
	}

	it("should load a document", async () => {
		const {handleA, wrapper} = setup()
		const onDoc = vi.fn()

		render(() => <Component url={handleA.url} onDoc={onDoc} />, {wrapper})
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "A"}))
	})

	it("should immediately return a document if it has already been loaded", async () => {
		const {handleA, wrapper} = setup()
		const onDoc = vi.fn()

		render(() => <Component url={handleA.url} onDoc={onDoc} />, {wrapper})
		await waitFor(() => expect(onDoc).not.toHaveBeenCalledWith(undefined))
	})

	it("should update if the doc changes", async () => {
		const {wrapper, handleA} = setup()
		const onDoc = vi.fn()

		render(() => <Component url={handleA.url} onDoc={onDoc} />, {wrapper})
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "A"}))

		handleA.change(doc => (doc.foo = "new value"))
		await waitFor(() =>
			expect(onDoc).toHaveBeenLastCalledWith({foo: "new value"})
		)
	})

	it("should update if the doc is deleted", async () => {
		const {wrapper, handleA} = setup()
		const onDoc = vi.fn()

		render(() => <Component url={handleA.url} onDoc={onDoc} />, {wrapper})
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "A"}))

		handleA.delete()
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith(undefined))
	})

	it("should update if the url changes", async () => {
		const {handleA, handleB, wrapper} = setup()
		const onDoc = vi.fn()
		const [url, updateURL] = createSignal<AutomergeUrl | undefined>()

		render(() => <Component url={url()} onDoc={onDoc} />, {
			wrapper,
		})
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith(undefined))

		// set url to doc A
		updateURL(handleA.url)
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "A"}))

		// set url to doc B
		updateURL(handleB.url)
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "B"}))

		// set url to undefined
		updateURL(undefined)
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith(undefined))
	})

	it("sets the doc to undefined while the initial load is happening", async () => {
		const {handleA, handleSlow, wrapper} = setup()
		const onDoc = vi.fn()
		const [url, updateURL] = createSignal<AutomergeUrl | undefined>()

		render(() => <Component url={url()} onDoc={onDoc} />, {
			wrapper,
		})
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith(undefined))

		// start by setting url to doc A
		updateURL(handleA.url)
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "A"}))

		// Now we set the URL to a handle that's slow to load.
		// The doc should be undefined while the load is happening.
		updateURL(handleSlow.url)
		await waitFor(() => expect(onDoc).toHaveBeenCalledWith(undefined))
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "slow"}))
	})

	it("avoids showing stale data", async () => {
		const {handleA, handleSlow, wrapper} = setup()
		const onDoc = vi.fn()
		const [url, updateURL] = createSignal<AutomergeUrl | undefined>()
		render(() => <Component url={url()} onDoc={onDoc} />, {
			wrapper,
		})
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith(undefined))

		// Set the URL to a slow doc and then a fast doc.
		// We should see the fast doc forever, even after
		// the slow doc has had time to finish loading.
		updateURL(handleSlow.url)
		updateURL(handleA.url)
		await waitFor(() => expect(onDoc).toHaveBeenLastCalledWith({foo: "A"}))

		// wait for the slow doc to finish loading...
		await pause(SLOW_DOC_LOAD_TIME_MS * 2)

		// we didn't update the doc to the slow doc, so it should still be A
		expect(onDoc).not.toHaveBeenCalledWith({foo: "slow"})
	})
})

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface ExampleDoc {
	foo: string
}
