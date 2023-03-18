import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
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
          By default, values stored in a{" "}
          <code>
            <Link to={CREATE_CACHE}>createCache</Link>
          </code>{" "}
          will never be garbage collected unless they are explicitly removed
          from the cache. This is the default behavior because it is the most
          predictable. However this behavior can be customized using the{" "}
          <code>getCache</code> configuration option as shown below.
        </p>
        <Note>
          <p>
            Caches that do not evict values may cause memory leaks for certain
            types of applications.
          </p>
        </Note>
      </Block>
      <Block>
        <SubHeading title="LRU cache" />
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
        <SubHeading title="WeakRef cache" />
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
