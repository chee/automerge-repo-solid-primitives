// initialize the wasm modules before any test constructs a Repo. the
// subduction Repo pulls MemorySigner from `@automerge/automerge-subduction/slim`
// (no auto-init), so we eagerly load the wasm via `initSubduction()` here.
import {next as Automerge} from "@automerge/automerge"
import {initSubduction} from "@automerge/automerge-repo"

Automerge.init({})
await initSubduction()
