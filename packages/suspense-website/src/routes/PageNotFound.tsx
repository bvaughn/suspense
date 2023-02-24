import Block from "../components/Block";
import Container from "../components/Container";
import Header from "../components/Header";

export default function PageNotFoundRoute() {
  return (
    <Container>
      <Block>
        <Header title="Page not found" />
      </Block>
      <Block>
        <p>Sorry. We couldn't find that page.</p>
      </Block>
    </Container>
  );
}
