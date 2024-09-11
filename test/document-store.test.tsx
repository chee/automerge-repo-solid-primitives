import {PeerId, Repo} from "@automerge/automerge-repo"
import {renderHook, testEffect} from "@solidjs/testing-library"
import {describe, expect, it, vi} from "vitest"
import {createDocumentStore} from "../src/create-document-store.ts"
import {RepoContext} from "../src/repo.ts"
import {createEffect, runWithOwner, type ParentComponent} from "solid-js"

describe("createDocumentStore", () => {
	function setup() {
		const repo = new Repo({
			peerId: "bob" as PeerId,
		})

		const handle = repo.create<ExampleDoc>({
			key: "value",
			array: [1, 2, 3],
			hellos: [{hello: "world"}, {hello: "hedgehog"}],
			projects: [{title: "one", items: [{title: "go shopping"}]}],
		})

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
		}
	}

	it("should notify on a property change", async () => {
		const {handle} = setup()
		const {
			result: [doc, change],
			owner,
		} = renderHook(createDocumentStore, {
			initialProps: [() => handle],
		})
		const done = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc.key).toBe("value")
				} else if (run == 1) {
					expect(doc.key).toBe("hello world!")
				} else if (run == 2) {
					expect(doc.key).toBe("friday night!")
					done()
				}
				return run + 1
			})
		}, owner!)
		runWithOwner(owner, () => {
			change(doc => (doc.key = "hello world!"))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.key = "friday night!"))
		})
		return done
	})

	it("should ignore properties nobody cares about", async () => {
		const {handle} = setup()
		const ch = vi.fn()
		const {
			result: [doc, change],
			owner,
		} = renderHook(createDocumentStore, {
			initialProps: [() => handle],
		})
		const arrayDotThree = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc.array[3]).toBeUndefined()
				} else if (run == 1) {
					expect(doc.array[3]).toBe(145)
				} else if (run == 2) {
					expect(doc.array[3]).toBe(147)
					done()
				}
				return run + 1
			})
		}, owner!)
		const projectZeroItemZeroTitle = testEffect(done => {
			createEffect((run: number = 0) => {
				if (run == 0) {
					expect(doc.projects[0].items[0].title).toBe("go shopping")
				}
				if (run == 1) {
					expect(doc.projects[0].items[0].title).toBe("hello world!")
					done()
				}
				return run + 1
			})
		}, owner!)
		runWithOwner(owner, () => {
			change(doc => (doc.array[2] = 22))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.key = "hello world!"))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.array[1] = 11))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.array[3] = 145))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.projects[0].title = "hello world!"))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.projects[0].items[0].title = "hello world!"))
		})
		runWithOwner(owner, () => {
			change(doc => (doc.array[3] = 147))
		})
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
