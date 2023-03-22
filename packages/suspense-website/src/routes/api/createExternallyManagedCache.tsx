import Block from "../../components/Block";
import Container from "../../components/Container";
import Code from "../../components/Code";
import { createExternallyManagedCache } from "../../examples";
import Header from "../../components/Header";
import { Link } from "react-router-dom";
import { CREATE_CACHE } from "../config";
import Note from "../../components/Note";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="createExternallyManagedCache" />
      </Block>
      <Block>
        <p>
          Convenience wrapper around{" "}
          <code>
            <Link to={CREATE_CACHE}>createCache</Link>
          </code>{" "}
          for caches that are externally managed.
        </p>
        <Code code={createExternallyManagedCache.cache} />
        <Note>
          An "externally managed" cache is one that does not load its own data.
        </Note>
      </Block>
    </Container>
  );
}
