import Block from "../components/Block";
import Container from "../components/Container";
import Code from "../components/Code";
import { createCache } from "../examples/";
import Header from "../components/Header";
import SubHeading from "../components/SubHeading";
import { Link } from "react-router-dom";
import { USE_CACHE_STATUS } from "./config";
import Note from "../components/Note";
import { ExternalLink } from "../components/ExternalLink";

export default function CreateCacheRoute() {
  return (
    <Container>
      <Block>
        <Header title="createCache" />
      </Block>
      <Block>
        <SubHeading title="Creating a cache" />
        <p>
          For the purposes of this library– a <strong>cache</strong> is a
          key-value store that can be lazily loaded by a React component while
          it is rendering. (This is done using an experimental React feature
          known as{" "}
          <ExternalLink to="https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks">
            suspense
          </ExternalLink>
          .)
        </p>
        <p>
          Implementing one of these caches typically only requires a single
          method (to load the data). For example, a cache that loads user data
          from a (JSON) API might look like this:
        </p>
        <Code code={createCache.cache} />
        <p>
          If one of the cache key parameters can't be stringified, a second
          method should also be provided to compute a unique key.
        </p>
        <Code code={createCache.cacheWithKey} />
      </Block>
      <Block>
        <SubHeading title="Using a cache with suspense" />
        <p>
          Caches can be used within a React component to fetch data. If the data
          has already been loaded, it will be returned synchronously. Otherwise
          the component will "suspend" while the data is fetched.
        </p>
        <Code code={createCache.suspense} />
        <Note>
          Caches currently suspend by throwing{" "}
          <Link to="/isThenable">"thenables"</Link>. This may change as the{" "}
          <ExternalLink to="https://github.com/reactjs/rfcs/pull/229">
            React API
          </ExternalLink>{" "}
          changes.
        </Note>
      </Block>
      <Block>
        <SubHeading title="Other ways to use a cache" />
        <p>For convenience, caches can also be used within async methods.</p>
        <Code code={createCache.async} />
        <p>
          Data loaded this way will be stored in such a way as to be shared with
          data loaded via suspense.
        </p>
        <p>
          Although not commonly needed, data can even be loaded synchronously
          from the cache.
        </p>
        <Code code={createCache.sync} />
      </Block>
      <Block>
        <SubHeading title="Pre-fetching a cache" />
        <p>
          When possible, it's best to pre-fetch data to avoid{" "}
          <ExternalLink to="https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks">
            "waterfalls"
          </ExternalLink>
          .
        </p>
        <Code code={createCache.prefetch} />
      </Block>
      <Block>
        <SubHeading title="Evicting stale values" />
        <p>Stale values can be evicted from a cache.</p>
        <Code code={createCache.evict} />
        <Note>
          Evicting cache values does not currently schedule an update with
          React.
        </Note>
      </Block>
      <Block>
        <SubHeading title="Observing status" />
        <p>
          A value's <em>status</em> ("not-started", "pending", "resolved", or
          "rejected") can be queried as well using <code>cache.getStatus</code>–
          although the recommended way to subscribe to this value is using the{" "}
          <code>
            <Link to={USE_CACHE_STATUS}>useCacheStatus</Link>
          </code>{" "}
          hook:
        </p>
        <Code code={createCache.hook} />
      </Block>
    </Container>
  );
}
