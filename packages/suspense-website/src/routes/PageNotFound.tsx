import Block from "../components/Block";
import Container from "../components/Container";
import Header from "../components/Header";
import SubHeading from "../components/SubHeading";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header />
      </Block>
      <Block>
        <SubHeading title="404 – Page not found" />
        <p>Sorry. We couldn't find that page.</p>
      </Block>
    </Container>
  );
}
