# suspense

APIs to simplify data loading and caching. Primarily intended for use with [React Suspense](https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks).

#### ⚠️ Considerations
1. Suspense is an experimental, pre-release feature; **these APIs will change** along with React.
1. This package depends on `react@experimental` and `react-dom@experimental` versions.

---

### If you like this project, 🎉 [become a sponsor](https://github.com/sponsors/bvaughn/) or ☕ [buy me a coffee](http://givebrian.coffee/)

#### Example

```js
import { createCache } from "suspense";

const userProfileCache = createCache({
  load: async ([userId]) => {
    const response = await fetch(`/api/user?id=${userId}`);
    return await response.json();
  },
});

function UserProfile({ userId }) {
  const userProfile = userProfileCache.read(userId);

  // ...
}
```

More examples at [suspense.vercel.app](https://suspense.vercel.app/).

#### If you like this project, [buy me a coffee](http://givebrian.coffee/).