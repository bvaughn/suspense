import Block from "../components/Block";
import Container from "../components/Container";
import Header from "../components/Header";

export default function PageNotFoundRoute() {
  return (
    <Container>
      <Header title="Page not found" />
      <Block>
        <p>Sorry. We couldn't find that page.</p>
      </Block>
    </Container>
  );
}
