import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import SubHeading from "../../components/SubHeading";
import { createIntervalCache } from "../../examples";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="createIntervalCache" />
      </Block>
      <Block>
        <p>
          An "interval cache" is a specialized cache that incrementally loads
          and merges sets of values over time.
        </p>
        <p>
          An example of this is{" "}
          <ExternalLink to="https://replay.io">Replay.io</ExternalLink> which
          fetches console logs for the region of a recording a user has
          "focused" on. If the user changes the focused region, additional logs
          may need to be fetched. As logs are fetched, they are merged into the
          larger data set to avoid re-fetching data when possible.
        </p>
      </Block>
      <Block>
        <SubHeading title="Creating an interval cache" />
        <p>
          Unlike a regular cache, multiple methods are required to configure an
          interval cache. At a minimum– one to load values (<code>load</code>)
          and one to specify where values fall within an interval (
          <code>getPointForValue</code>).
        </p>
        <p>
          For example, a cache could incrementally load syntax–highlighted
          source code for a range of lines.
        </p>
        <Code code={createIntervalCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Custom comparisons" />
        <p>
          Points in an interval are typically numbers (e.g. 1, 3.5) but they can
          also be{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt">
              BigInts
            </ExternalLink>
          </code>
          . In that case a custom comparison function should be provided.
        </p>
        <p>
          Here is an example using the NPM package{" "}
          <code>
            <ExternalLink to="https://www.npmjs.com/package/extra-bigint">
              extra-bigint
            </ExternalLink>
          </code>
          :
        </p>
        <Code code={createIntervalCache.cacheWithBigIntInterval} />
      </Block>
      <Block>
        <SubHeading title="Aborting requests" />
        <p>
          Interval cache supports cancellation the same way as other caches– by
          passing an{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
              AbortSignal
            </ExternalLink>
          </code>{" "}
          to the custom <code>load</code> method.
        </p>
        <Code code={createIntervalCache.loadWithAbortSignal} />
        <p>
          Requests can be cancelled from the outside using the{" "}
          <code>abort</code> method.
        </p>
        <Code code={createIntervalCache.callingAbort} />
        <Note>
          <p>
            Aborting an interval requests cancels{" "}
            <strong>all pending requests</strong> for that set of parameters. It
            is not possible to abort a specific interval.
          </p>
        </Note>
      </Block>
      <Block>
        <SubHeading title="Evicting values" />
        <p>
          Values can be evicted from an interval cache using the{" "}
          <code>evict</code> and <code>evictAll</code> methods.
        </p>
        <Code code={createIntervalCache.evict} />
        <Note>
          <p>
            Evicting values from an interval cache will evict{" "}
            <strong>all loaded values</strong> for that set of parameters. It is
            not possible to evict a specific interval.
          </p>
        </Note>
      </Block>
      <Block>
        <SubHeading title="Partial results" />
        <p>
          If data cannot be fully fetched for a given intervals, the value
          returned can be flagged as <em>partial results</em> as shown below.
        </p>
        <Code code={createIntervalCache.cacheWithPartialResults} />
        <p>
          The <code>isPartialResult</code> method can be used to check if a
          value only contains partial results.
        </p>
        <Code code={createIntervalCache.detectingPartialResults} />
      </Block>
    </Container>
  );
}
