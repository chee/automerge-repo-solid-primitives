import { createContext as l, useContext as f, createResource as a, onMount as p, onCleanup as s, createEffect as h, on as d } from "solid-js";
const i = l(null);
function m() {
  const e = f(i);
  if (!e) throw new Error("Please wrap me in a <RepoContext value={repo}>");
  return e;
}
function w(e) {
  let t = m(), [o] = a(e(), async () => {
    if (!e())
      return;
    let n = t.find(e());
    return await n.whenReady(), n;
  });
  return () => o.latest;
}
function C(e) {
  let t = w(e), [o, { refetch: n, mutate: u }] = a(
    t(),
    () => t()?.doc()
  );
  return p(() => {
    n(), t()?.on("change", n), t()?.on("delete", n);
  }), s(() => {
    t()?.off("change", n), t()?.off("delete", n);
  }), h(d([e], ([r]) => e() == r || u())), [
    o,
    (r, c) => {
      t()?.change(r, c);
    }
  ];
}
export {
  i as RepoContext,
  C as useDocument,
  w as useHandle,
  m as useRepo
};
