import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
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
          Caches created with{" "}
          <code>
            <Link to={CREATE_CACHE}>createCache</Link>
          </code>{" "}
          use{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef">
              WeakRef
            </ExternalLink>
          </code>{" "}
          and{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry">
              FinalizationRegistry
            </ExternalLink>
          </code>{" "}
          APIs to avoid leaking memory. This behavior can be disabled using the{" "}
          <code>useWeakRef</code> configuration flag.
        </p>
        <Code code={createCache.cacheWithoutWeakRef} />
        <Note type="warn">
          <p>Caches that don't use weak refs may leak memory over time.</p>
          <p>
            To avoid this, use the <code>evict</code> method to remove entries
            once you are done using them.
          </p>
        </Note>
      </Block>
    </Container>
  );
}
