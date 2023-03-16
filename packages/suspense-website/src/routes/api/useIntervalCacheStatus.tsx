import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import SubHeading from "../../components/SubHeading";
import { createIntervalCache } from "../../examples";
import { CREATE_INTERVAL_CACHE } from "../config";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="useIntervalCacheStatus" />
      </Block>
      <Block>
        <SubHeading title="Observing status" />
        <p>
          Subscribe to the <em>status</em> of an{" "}
          <Link to={CREATE_INTERVAL_CACHE}>interval cache</Link> ("not-found",
          "pending", "resolved", or "rejected") using the{" "}
          <code>useIntervalCacheStatus</code> hook:
        </p>
        <Code code={createIntervalCache.hook} />
      </Block>
    </Container>
  );
}
