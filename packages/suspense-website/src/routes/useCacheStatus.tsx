import { Link } from "react-router-dom";
import Block from "../components/Block";
import Code from "../components/Code";
import Container from "../components/Container";
import Header from "../components/Header";
import SubHeading from "../components/SubHeading";
import { createCache } from "../examples";
import { CREATE_CACHE } from "./config";

export default function UseCacheStatusRoute() {
  return (
    <Container>
      <Block>
        <Header title="useCacheStatus" />
      </Block>
      <Block>
        <SubHeading title="Observing status" />
        <p>
          Subscribe to the <em>status</em> of a{" "}
          <Link to={CREATE_CACHE}>cache</Link> ("not-started", "pending",
          "resolved", or "rejected") using the <code>useCacheStatus</code> hook:
        </p>
        <Code code={createCache.hook} />
      </Block>
    </Container>
  );
}
