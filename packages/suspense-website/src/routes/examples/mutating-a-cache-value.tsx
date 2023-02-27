import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { demos } from "../../examples";
import Demo from "../../examples/demos/mutating-a-cache-value";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="mutating a cache value" />
      </Block>
      <Block>
        <p>Coming soon.</p>
      </Block>
      <Block type="demo">
        <Demo />
      </Block>
      <Block>
        <Code code={demos.mutatingCacheValue.addComment} />
      </Block>
    </Container>
  );
}
