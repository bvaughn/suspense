import Container from "../components/Container";
import Code from "../components/Code";
import { createStreamingCache } from "../examples/";
import Header from "../components/Header";
import Block from "../components/Block";
import SubHeading from "../components/SubHeading";
import { Link } from "react-router-dom";
import { USE_STREAMING_CACHE } from "./config";

export default function CreateStreamingCacheRoute() {
  return (
    <Container>
      <Header title="createStreamingCache" />
      <Block>
        <SubHeading title="Creating a streaming cache" />
        <p>
          A "streaming cache" fits a different use case than a normal cache.
          Rather than <em>suspending</em> until a value has been fully loaded,
          it provides a subscription interface that can be used to re-render as
          data incrementally loads.
        </p>
        <p>Implementing a streaming cache requires two methods:</p>
        <ul>
          <li>
            One to compute a <em>unique key</em> from cache parameters, and
          </li>
          <li>
            One to stream the data using an API like a <code>WebSocket</code>
          </li>
        </ul>
        <Code code={createStreamingCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Using a streaming cache" />
        <p>
          The easiest way to use a streaming cache is with the{" "}
          <Link to={USE_STREAMING_CACHE}>
            <code>useStreamingCache</code>
          </Link>{" "}
          hook.
        </p>
        <Code code={createStreamingCache.hook} />
      </Block>
      <Block>
        <SubHeading title="Pre-fetching values" />
        <p>Like a normal cache, streaming values can be pre-fetched.</p>
        <Code code={createStreamingCache.prefetch} />
      </Block>
    </Container>
  );
}
