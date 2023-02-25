import Container from "../../components/Container";
import Code from "../../components/Code";
import { createStreamingCache } from "../../examples";
import Header from "../../components/Header";
import Block from "../../components/Block";
import SubHeading from "../../components/SubHeading";
import { Link } from "react-router-dom";
import { USE_STREAMING_CACHE } from "../config";
import Note from "../../components/Note";
import { ExternalLink } from "../../components/ExternalLink";

export default function CreateStreamingCacheRoute() {
  return (
    <Container>
      <Block>
        <Header title="createStreamingCache" />
      </Block>
      <Block>
        <SubHeading title="Creating a streaming cache" />
        <p>
          A "streaming cache" fits a different use case than a normal cache.
          Rather than <em>suspending</em> until a value has been fully loaded,
          it provides a subscription interface that can be used to re-render as
          data incrementally loads.
        </p>
        <p>
          Like a regular cache, implementing a streaming cache typically only
          requires a single method– to stream the data using an API like a{" "}
          <code>WebSocket</code>.
        </p>
        <Code code={createStreamingCache.cache} />
        <p>
          A second method can be provided to compute the cache key if one of the
          parameters can't be stringified.
        </p>
        <Code code={createStreamingCache.cacheWithKey} />
        <p>
          Use the{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
              AbortSignal
            </ExternalLink>
          </code>{" "}
          that's provided to support cancellation.
        </p>
        <Code code={createStreamingCache.cacheWithSignal} />
      </Block>
      <Block>
        <SubHeading title="Using a streaming cache" />
        <p>
          The easiest way to use a streaming cache is with the{" "}
          <code>
            <Link to={USE_STREAMING_CACHE}>useStreamingValues</Link>
          </code>{" "}
          hook.
        </p>
        <Code code={createStreamingCache.hook} />
      </Block>
      <Block>
        <SubHeading title="Pre-fetching values" />
        <p>Like a normal cache, streaming values can be pre-fetched.</p>
        <Code code={createStreamingCache.prefetch} />
      </Block>
      <Block>
        <SubHeading title="Evicting stale values" />
        <p>Stale values can be evicted from a cache.</p>
        <Code code={createStreamingCache.evict} />
        <Note>
          Evicting cache values does not currently schedule an update with
          React.
        </Note>
      </Block>
      <Block>
        <SubHeading title="Aborting a request" />
        <p>In-progress requests can be cancelled.</p>
        <Code code={createStreamingCache.abort} />
        <Note>
          Requests can be aborted where side effects are permitted (e.g. event
          handlers, effect cleanup functions).
        </Note>
        <Note>
          A cache must use the <code>AbortSignal</code> parameter to support
          cancellation.
        </Note>
      </Block>
    </Container>
  );
}
