import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import SubHeading from "../../components/SubHeading";
import { createCache } from "../../examples";
import { CREATE_CACHE } from "../config";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="memory management" />
      </Block>
      <Block>
        <p>
          By default,{" "}
          <code>
            <Link to={CREATE_CACHE}>createCache</Link>
          </code>{" "}
          does not evict cache values. Depending on the needs of your
          application, use the
          <code>getCache</code> config option to specify a{" "}
          <ExternalLink to="https://en.wikipedia.org/wiki/Cache_replacement_policies">
            Least Recently Used (LRU) cache
          </ExternalLink>{" "}
          or{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef">
              WeakRef
            </ExternalLink>
          </code>{" "}
          based strategy instead.
        </p>
      </Block>
      <Block>
        <SubHeading title="LRU Cache" />
        <p>
          The easiest way to do this is to use a pre-built cache like{" "}
          <code>
            <ExternalLink to="https://www.npmjs.com/package/lru-cache">
              lru-cache
            </ExternalLink>
          </code>
          .
        </p>
        <Code code={createCache.cacheWithLRU} />
      </Block>
      <Block>
        <SubHeading title="WeakRef" />
        <p>
          Caches can be configured to store values in a <code>WeakRef</code> as
          well. The easiest way to do this is using the provided{" "}
          <code>WeakRefMap</code> class.
        </p>
        <Code code={createCache.cacheWithWeakRefMap} />
      </Block>
    </Container>
  );
}
