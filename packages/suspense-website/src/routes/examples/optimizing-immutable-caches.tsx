import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import { createCache } from "../../examples";
import { USE_CACHE_MUTATION } from "../config";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="optimizing immutable caches" />
      </Block>
      <Block>
        <p>
          If a cache contains values that will never be mutated, the{" "}
          <code>immutable</code> config flag can be used to avoid potential
          unnecessary renders after other caches have been mutated. (To learn
          more about this optimization, check out this{" "}
          <ExternalLink to="https://www.loom.com/share/dde355b8a9e643adb146768cbd943d39">
            deep dive video
          </ExternalLink>
          .)
        </p>
      </Block>
      <Block>
        <Code code={createCache.immutable} />
      </Block>
      <Note type="warn">
        <p>
          Passing an immutable cache to the{" "}
          <code>
            <Link to={USE_CACHE_MUTATION}>useCacheMutation</Link>
          </code>{" "}
          hook will throw an error.
        </p>
      </Note>
    </Container>
  );
}
