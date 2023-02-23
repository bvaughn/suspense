import Block from "../components/Block";
import Container from "../components/Container";
import Code from "../components/Code";
import { createCache } from "../examples/";
import Header from "../components/Header";
import SubHeading from "../components/SubHeading";
import { Link } from "react-router-dom";
import { USE_CACHE_STATUS } from "./config";

export default function CreateCacheRoute() {
  return (
    <Container>
      <Header title="createCache" />
      <Block>
        <SubHeading title="Creating a cache" />
        <p>Implementing a cache requires two methods:</p>
        <ul>
          <li>
            One to compute a <em>unique key</em> from cache parameters, and
          </li>
          <li>One to load the data</li>
        </ul>
        <p>
          For example, loading user data from a JSON API might look like this:
        </p>
        <Code code={createCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Using a cache with suspense" />
        <p>
          Caches can be used within a React component to fetch data. If the data
          has already been loaded, it will be returned synchronously. Otherwise
          the component will <em>suspend</em> while the data is fetched.
        </p>
        <Code code={createCache.suspense} />
        <SubHeading title="Using a cache in an async function" />
        <p>For convenience, caches can also be used within async methods.</p>
        <Code code={createCache.async} />
      </Block>
      <Block>
        <SubHeading title="Pre-fetching a cache" />
        <p>
          When possible, it's best to pre-fetch data to avoid{" "}
          <a href="https://17.reactjs.org/docs/concurrent-mode-suspense.html#traditional-approaches-vs-suspense">
            "waterfallse"
          </a>
          .
        </p>
        <Code code={createCache.prefetch} />
      </Block>
      <Block>
        <SubHeading title="Evicting stale values" />
        <p>
          Stale values can be evicted from a cache (although note that this does
          not currently schedule an update with React).
        </p>
        <Code code={createCache.evict} />
      </Block>
      <Block>
        <SubHeading title="Observing status" />
        <p>
          A value's <em>status</em> ("pending", "resolved", or "rejected") can
          be queried as well using <code>cache.getStatus</code>– although the
          recommended way to subscribe to this value is using the{" "}
          <Link to={USE_CACHE_STATUS}>
            <code>useCacheStatus</code>
          </Link>{" "}
          hook:
        </p>
        <Code code={createCache.hook} />
      </Block>
    </Container>
  );
}
