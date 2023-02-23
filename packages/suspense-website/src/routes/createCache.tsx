import Block from "../components/Block";
import Container from "../components/Container";
import Code from "../components/Code";
import { createCache } from "../examples/";
import Header from "../components/Header";
import SubHeading from "../components/SubHeading";
import { Link } from "react-router-dom";
import { USE_CACHE_STATUS } from "./config";
import Note from "../components/Note";

export default function CreateCacheRoute() {
  return (
    <Container>
      <Header title="createCache" />
      <Block>
        <SubHeading title="Creating a cache" />
        <p>
          For the purposes of this library– a <strong>cache</strong> is a
          key-value store that can be lazily loaded by a React component while
          it is rendering. (This is done using an experimental React feature
          known as{" "}
          <a href="https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks">
            suspense
          </a>
          .)
        </p>
        <p>Implementing one of these caches requires two methods:</p>
        <ul>
          <li>
            One to compute a <em>unique key</em> from cache parameters, and
          </li>
          <li>One to load the data</li>
        </ul>
        <p>
          For example, a cache that loads user data from a (JSON) API might look
          like this:
        </p>
        <Code code={createCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Using a cache with suspense" />
        <p>
          Caches can be used within a React component to fetch data. If the data
          has already been loaded, it will be returned synchronously. Otherwise
          the component will "suspend" while the data is fetched.
        </p>
        <Note>
          Note this is currently implemented by throwing a{" "}
          <Link to="/isThennable">"thennable"</Link> and may change as the
          underlying{" "}
          <a href="https://github.com/reactjs/rfcs/pull/229">React API</a>{" "}
          changes.
        </Note>
        <Code code={createCache.suspense} />
      </Block>
      <Block>
        <SubHeading title="Using a cache in an async function" />
        <p>For convenience, caches can also be used within async methods.</p>
        <Code code={createCache.async} />
      </Block>
      <Block>
        <SubHeading title="Pre-fetching a cache" />
        <p>
          When possible, it's best to pre-fetch data to avoid{" "}
          <a href="https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks">
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
