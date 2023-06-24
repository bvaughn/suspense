import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { debugLogging } from "../../examples";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="debugging slow requests" />
      </Block>
      <Block>
        <p>
          In development mode, <code>"suspense"</code> can be configured to log
          timing information. Logging can be enabled/disabled per cache:
        </p>
        <Code code={debugLogging.perCache} />
        <p>It can also be done globally (for all caches).</p>
        <Code code={debugLogging.global} />
      </Block>
    </Container>
  );
}
