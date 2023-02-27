import Block from "../../components/Block";
import Container from "../../components/Container";
import Code from "../../components/Code";
import { createSingleEntryCache } from "../../examples";
import Header from "../../components/Header";
import { Link } from "react-router-dom";
import { CREATE_CACHE } from "../config";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="createSingleEntryCache" />
      </Block>
      <Block>
        <p>
          Convenience wrapper around{" "}
          <code>
            <Link to={CREATE_CACHE}>createCache</Link>
          </code>{" "}
          for caches that only contain a single value.
        </p>
        <Code code={createSingleEntryCache.cache} />
        <p>
          This type of cache can still accept parameters, although they won't be
          used to store the cached value.
        </p>
        <Code code={createSingleEntryCache.cacheWithParameters} />
      </Block>
    </Container>
  );
}
