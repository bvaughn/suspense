import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import SubHeading from "../../components/SubHeading";
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
          Here's an example app that uses <code>useCacheMutation</code> to add,
          edit, and delete entries from a TODO list.
        </p>
      </Block>
      <Block type="demo">
        <Demo />
      </Block>
      <Block>
        <SubHeading title="Adding an item" />
        <Code code={demos.mutatingCacheValue.addItem} />
      </Block>
    </Container>
  );
}
