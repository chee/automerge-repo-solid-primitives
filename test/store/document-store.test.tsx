import {PeerId, Repo, type AutomergeUrl} from "@automerge/automerge-repo"
import {renderHook, testEffect} from "@solidjs/testing-library"
import {describe, expect, it, vi} from "vitest"
import {createDocumentStore} from "../../src/store/document-store.ts"
import {RepoContext} from "../../src/repo.ts"
import {createEffect, createSignal, type ParentComponent} from "solid-js"
import {useHandle} from "../../src/handle.ts"

describe("createDocumentStore", () => {
	function setup() {
		const repo = new Repo({
			peerId: "bob" as PeerId,
		})

		const create = () =>
			repo.create<ExampleDoc>({
				key: "value",
				array: [1, 2, 3],
				hellos: [{hello: "world"}, {hello: "hedgehog"}],
				projects: [
					{title: "one", items: [{title: "go shopping"}]},
					{title: "two", items: []},
				],
			})

		const handle = create()
		const wrapper: ParentComponent = props => {
			return (
				<RepoContext.Provider value={repo}>
					{props.children}
				</RepoContext.Provider>
			)
		}

		return {
			repo,
			handle,
			wrapper,
			create,
		}
	}

	it("should notify on a property change", async () => {
		const {handle} = setup()
		const {result: doc, owner} = renderHook(createDocumentStore, {
			initialProps: [() => handle],
		})

		const done = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc()?.key).toBe("value")
					handle.change(doc => (doc.key = "hello world!"))
				} else if (run == 1) {
					expect(doc()?.key).toBe("hello world!")
					handle.change(doc => (doc.key = "friday night!"))
				} else if (run == 2) {
					expect(doc()?.key).toBe("friday night!")
					done()
				}
				return run + 1
			})
		}, owner!)
		return done
	})

	it("should work with useHandle", async () => {
		const {
			handle: {url},
			wrapper,
		} = setup()
		const {result: handle} = renderHook(useHandle<ExampleDoc>, {
			initialProps: [() => url],
			wrapper,
		})
		const {result: doc, owner} = renderHook(createDocumentStore, {
			initialProps: [handle],
		})

		const done = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc()?.key).toBe("value")
					handle()?.change(doc => (doc.key = "hello world!"))
				} else if (run == 1) {
					expect(doc()?.key).toBe("hello world!")
					handle()?.change(doc => (doc.key = "friday night!"))
				} else if (run == 2) {
					expect(doc()?.key).toBe("friday night!")
					done()
				}

				return run + 1
			})
		}, owner!)

		return done
	})

	it("should work with a signal url", async () => {
		const [url, setURL] = createSignal<AutomergeUrl>()
		const {create, wrapper} = setup()
		const {result: handle} = renderHook(useHandle<ExampleDoc>, {
			initialProps: [url],
			wrapper,
		})
		const {result: doc, owner} = renderHook(createDocumentStore, {
			initialProps: [handle],
		})
		const done = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc()?.key).toBe(undefined)
					setURL(create().url)
				} else if (run == 1) {
					expect(doc()?.key).toBe("value")
					handle()?.change(doc => (doc.key = "hello world!"))
				} else if (run == 2) {
					expect(doc()?.key).toBe("hello world!")
					handle()?.change(doc => (doc.key = "friday night!"))
				} else if (run == 3) {
					expect(doc()?.key).toBe("friday night!")
					done()
				}

				return run + 1
			})
		}, owner!)
		return done
	})

	it("should work with a slow handle", async () => {
		const {create} = setup()
		const handleSlow = create()
		handleSlow.change(doc => (doc.key = "slow"))
		const oldDoc = handleSlow.doc.bind(handleSlow)
		let loaded = false
		const delay = new Promise<boolean>(resolve =>
			setTimeout(() => {
				loaded = true
				resolve(true)
			}, 100)
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
		handleSlow.isReady = () => loaded
		handleSlow.whenReady = () => delay.then(() => {})

		const {result: doc, owner} = renderHook(createDocumentStore, {
			initialProps: [() => handleSlow],
		})
		const done = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc()?.key).toBe(undefined)
				} else if (run == 1) {
					expect(doc()?.key).toBe("slow")
					done()
				}
				return run + 1
			})
		}, owner!)
		return done
	})

	it("should ignore properties nobody cares about", async () => {
		const {handle} = setup()
		let fn = vi.fn()

		const {result: doc, owner} = renderHook(createDocumentStore, {
			initialProps: [() => handle],
		})
		createEffect(() => {
			fn(doc()?.projects[1].title)
		})
		const arrayDotThree = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc()?.array[3]).toBeUndefined()
					handle.change(doc => (doc.array[2] = 22))
					handle.change(doc => (doc.key = "hello world!"))
					handle.change(doc => (doc.array[1] = 11))
					handle.change(doc => (doc.array[3] = 145))
				} else if (run == 1) {
					expect(doc()?.array[3]).toBe(145)
					handle.change(doc => (doc.projects[0].title = "hello world!"))
					handle.change(
						doc => (doc.projects[0].items[0].title = "hello world!")
					)
					handle.change(doc => (doc.array[3] = 147))
				} else if (run == 2) {
					expect(doc()?.array[3]).toBe(147)
					done()
				}
				return run + 1
			})
		}, owner!)
		const projectZeroItemZeroTitle = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc()?.projects[0].items[0].title).toBe("go shopping")
				}
				if (run == 1) {
					expect(doc()?.projects[0].items[0].title).toBe("hello world!")
					done()
				}
				return run + 1
			})
		}, owner!)

		expect(fn).toHaveBeenCalledOnce()
		expect(fn).toHaveBeenCalledWith("two")

		return Promise.all([arrayDotThree, projectZeroItemZeroTitle])
	})
})

interface ExampleDoc {
	key: string
	array: number[]
	hellos: {hello: string}[]
	projects: {
		title: string
		items: {title: string; complete?: number}[]
	}[]
}
