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
          By default{" "}
          <code>
            <Link to={CREATE_CACHE}>createCache</Link>
          </code>{" "}
          does not evict cache values. This means that over time, the size of
          the cache will grow and may cause memory issues for large
          applications. This behavior can be customized using the{" "}
          <code>getCache</code> configuration option as shown below.
        </p>
      </Block>
      <Block>
        <SubHeading title="LRU Cache" />
        <p>
          Caches can be configured to store values in a{" "}
          <ExternalLink to="https://en.wikipedia.org/wiki/Cache_replacement_policies">
            Least Recently Used (LRU) cache
          </ExternalLink>
          . The recommended way to do this is to use a pre-built cache like{" "}
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
          Caches can also be configured to store values in a{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef">
              WeakRef
            </ExternalLink>
          </code>
          . The recommended way to do this is using the provided{" "}
          <code>WeakRefMap</code> class.
        </p>
        <Code code={createCache.cacheWithWeakRefMap} />
      </Block>
    </Container>
  );
}
