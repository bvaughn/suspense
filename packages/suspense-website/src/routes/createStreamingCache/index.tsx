import Container from "../../components/Container";
import Code from "../../components/Code";
import { createStreamingCache } from "../../examples/";
import Header from "../../components/Header";
import Block from "../../components/Block";
import SubHeading from "../../components/SubHeading";

export default function CreateStreamingCacheRoute() {
  return (
    <Container>
      <Header title="createStreamingCache" />
      <Block>
        <p>
          A "streaming cache" fits a different use case than a normal cache.
          Rather than <em>suspending</em> until a value has been fully loaded,
          it provides a subscription interface that can be used to re-render as
          data incrementally loads.
        </p>
      </Block>
      <Block>
        <SubHeading title="Creating a streaming cache" />
        <p>
          Implementing a streaming cache only requires two methods: one to
          compute a <em>unique key</em> from cache parameters and one to stream
          the data using an API like a <code>WebSocket</code>.
        </p>
        <Code code={createStreamingCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Using a streaming cache" />
        <p>
          The easiest way to use a streaming cache is with the{" "}
          <code>useStreamingCache</code> hook.
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
