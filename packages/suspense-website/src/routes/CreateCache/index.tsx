import Container from "../../components/Container";
import Code from "../../components/Code";
import { async, cache, prefetch, suspense } from "../../examples/createCache";
import Header from "../../components/Header";

export default function CreateCacheRoute() {
  return (
    <Container>
      <Header title="createCache" />
      <h2>Creating a cache</h2>
      <p>
        Implementing a cache only requires two methods: one to compute a{" "}
        <em>unique key</em> from cache parameters and one to load the data. For
        example, loading user data from a JSON API might look like this:
      </p>
      <Code code={cache} />
      <h2>Using a cache with suspense</h2>
      <p>
        Caches can be used within a React component to fetch data. If the data
        has already been loaded, it will be returned synchronously. Otherwise
        the component will <em>suspend</em> while the data is fetched.
      </p>
      <Code code={suspense} />
      <h2>Using a cache in an async function</h2>
      <p>For convenience, caches can also be used within async methods.</p>
      <Code code={async} />
      <h2>Pre-fetching a cache</h2>
      <p>
        When possible, it's best to pre-fetch data to avoid{" "}
        <a href="https://17.reactjs.org/docs/concurrent-mode-suspense.html#traditional-approaches-vs-suspense">
          "waterfallse"
        </a>
        .
      </p>
      <Code code={prefetch} />
      <p>For more cache methods, see the README.</p>
    </Container>
  );
}
