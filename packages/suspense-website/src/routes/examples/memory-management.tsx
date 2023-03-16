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
          can be configured to use your own memory management strategy with the{" "}
          <code>getCache</code> config option. This enables using
          implementations like{" "}
          <code>
            <ExternalLink to="https://www.npmjs.com/package/lru-cache">
              lru-cache
            </ExternalLink>
          </code> to manage the cache size.
        </p>
        <Code code={createCache.cacheWithGetCache} />
        <Note type="warn">
          <p>
            By default, there is no memory management strategy. Caches may leak
            memory over time.
          </p>
          <p>
            To avoid this, use the <code>evict</code> method to remove entries
            once you are done using them.
          </p>
        </Note>
      </Block>
    </Container>
  );
}
