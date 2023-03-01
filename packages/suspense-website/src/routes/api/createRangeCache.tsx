import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
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
          larger data set such that any given log is only fetched once.
        </p>
      </Block>
      <Block>
        <SubHeading title="Creating a range cache" />
        <p>
          Unlike a regular cache, multiple methods are required to configure a
          range cache– one for loading and additional ones for iterating over
          and comparing range points.
        </p>
        <p>
          For example, a range cache could incrementally load syntax–highlighted
          source code for a range of lines.
        </p>
        <Code code={createRangeCache.cache} />
      </Block>
      <Block>
        <SubHeading title="Custom comparison" />
        <p>
          If a range of points are not <code>number</code>s but instead a type
          like{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt">
              BigInt
            </ExternalLink>
          </code>{" "}
          then a custom comparison function should be provided. For example,{" "}
          <ExternalLink to="https://www.npmjs.com/package/big.js">
            big.js
          </ExternalLink>{" "}
          could be used to implement a custom comparison function.
        </p>
        <Code code={createRangeCache.cacheWithCustomComparePoint} />
      </Block>
    </Container>
  );
}
