import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import Note from "../../components/Note";
import { demos } from "../../examples";
import Demo from "../../examples/demos/fetchWithStatus";

export default function UseStreamingValuesRoute() {
  return (
    <Container>
      <Block>
        <Header title="fetch with status" />
      </Block>
      <Block>
        <p>
          The demo below shows how the <code>useCacheStatus</code> hook can be
          used to render UI based on the status of a cached item. Click the
          "start demo" button to fetch user data in the cache.
        </p>
      </Block>
      <Block>
        <Demo />
      </Block>
      <Block>
        <p>
          Although the <code>UserStatusBadge</code> component is neither
          scheduling the update with React nor suspending to load user data, it
          uses <code>useCacheStatus</code> to update as the user records are
          fetched.
        </p>
        <Code code={demos.fetchWithStatus.UserStatusBadge} />
      </Block>

      <Note>
        The cache in this demo uses a timeout to simulate a slow network
        request.
      </Note>
    </Container>
  );
}
