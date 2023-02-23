import Container from "../../components/Container";
import Code from "../../components/Code";
import { cache, hook, prefetch } from "../../examples/createStreamingCache";
import Header from "../../components/Header";

export default function CreateStreamingCacheRoute() {
  return (
    <Container>
      <Header title="createStreamingCache" />
      <p>
        A "streaming cache" fits a different use case than a normal cache.
        Rather than <em>suspending</em> until a value has been fully loaded, it
        provides a subscription interface that can be used to re-render as data
        incrementally loads.
      </p>
      <h2>Creating a streaming cache</h2>
      <p>
        Implementing a streaming cache only requires two methods: one to compute
        a <em>unique key</em> from cache parameters and one to stream the data
        using an API like a <code>WebSocket</code>.
      </p>
      <Code code={cache} />
      <h2>Using a streaming cache</h2>
      <p>
        The easiest way to use a streaming cache is with the{" "}
        <code>useStreamingCache</code> hook.
      </p>
      <Code code={hook} />
      <h2>Pre-fetching values</h2>
      <p>Like a normal cache, streaming values can be pre-fetched.</p>
      <Code code={prefetch} />
    </Container>
  );
}
