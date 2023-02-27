# suspense

APIs to simplify data loading and caching. Primarily intended for use with [React Suspense](https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks).

* [View the website](https://suspense-npm.vercel.app/)
* [View the changelog](https://github.com/bvaughn/suspense/blob/main/packages/suspense/CHANGELOG.md)

### ⚠️ Considerations

1. Suspense is an experimental, pre-release feature; **these APIs will change** along with React.
1. This library has been optimized for applications like [Replay.io](https://replay.io) that lazy load **read-only data** during a session. Functionality like _mutation_ ([issues 7](https://github.com/bvaughn/suspense/issues/7)) and memory management ([issues 9](https://github.com/bvaughn/suspense/issues/7)) are still being considered.

---

#### If you like this project, [buy me a coffee](http://givebrian.coffee/).