import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { demos } from "../../examples";
import Demo from "../../examples/demos/mutating-cache-values";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="mutating cache values" />
      </Block>
      <Block>
        <p>
          Cache values can be mutated using the <code>useCacheMutation</code>{" "}
          hook. It supports two types of mutations:
        </p>
        <ul>
          <li>synchronous (e.g. optimistic updates from user input)</li>
          <li>asynchronously (e.g. API request)</li>
        </ul>
        <p>
          The hook also returns an <code>isPending</code> flag that can be used
          to update UI while a mutation is in progress.
        </p>
        <p>
          Below is an example list of comments. Adding, editing, or deleting
          items from this list uses <code>useCacheMutation</code> async
          mutations.
        </p>
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
