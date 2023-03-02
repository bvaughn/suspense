import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import SubHeading from "../../components/SubHeading";
import { createRangeCache } from "../../examples";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="createRangeCache" />
      </Block>
      <Block>
        <p>
          A "range cache" is a specialized cache that incrementally loads and
          merges ranges of values over time.
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
        <SubHeading title="Creating a range cache" />
        <p>
          Unlike a regular cache, multiple methods are required to configure a
          range cache. At a minimum– one to load values (<code>load</code>) and
          one to specify where values fall within a range (
          <code>getPointForValue</code>).
        </p>
        <p>
          For example, a cache could incrementally load syntax–highlighted
          source code for a range of lines.
        </p>
        <Code code={createRangeCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Custom comparisons" />
        <p>
          Ranges are often numbers (e.g. 1, 3.5) but they can be other types–
          like string or{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt">
              BigInt
            </ExternalLink>
          </code>
          . In that case a custom comparison function should be provided.
        </p>
        <p>
          For example, string ranges can be compared with{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare">
              String.prototype.localeCompare
            </ExternalLink>
          </code>
          .
        </p>
        <Code code={createRangeCache.cacheWithStringRange} />
        <p>
          <code>BigInt</code> ranges can be compared with an NPM package like{" "}
          <code>
            <ExternalLink to="https://www.npmjs.com/package/extra-bigint">
              extra-bigint
            </ExternalLink>
          </code>
          .
        </p>
        <Code code={createRangeCache.cacheWithBigIntRange} />
      </Block>
      <Block>
        <SubHeading title="Aborting requests" />
        <p>
          Range cache supports cancellation the same way as other caches– by
          passing an{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
              AbortSignal
            </ExternalLink>
          </code>{" "}
          to the custom <code>load</code> method.
        </p>
        <Code code={createRangeCache.loadWithAbortSignal} />
        <p>
          Requests can be cancelled from the outside using the{" "}
          <code>abort</code> method.
        </p>
        <Code code={createRangeCache.callingAbort} />
        <Note>
          <p>
            Aborting a range requests cancels{" "}
            <strong>all pending requests</strong> for that set of parameters. It
            is not possible to abort a specific range.
          </p>
        </Note>
      </Block>
      <Block>
        <SubHeading title="Evicting values" />
        <p>
          Values can be evicted from a range cache using the <code>evict</code>{" "}
          and <code>evictAll</code> methods.
        </p>
        <Code code={createRangeCache.evict} />
        <Note>
          <p>
            Evicting values from a range cache will evict{" "}
            <strong>all loaded values</strong> for that set of parameters. It is
            not possible to evict a specific range.
          </p>
        </Note>
      </Block>
    </Container>
  );
}
