import { Link } from "react-router-dom";
import Container from "../../components/Container";

export default function HomeRoute() {
  return (
    <Container>
      <h1>suspense</h1>
      <p>
        APIs to simplify data loading and caching. Primarily intended for use
        with React Suspense.
      </p>
      <p>
        Because Suspense is in an <strong>experimental</strong> pre-release{" "}
        state, these APIs may change.
      </p>
      <h2>Examples</h2>
      <h3>Caches</h3>
      <ul>
        <li>
          <Link to="/examples/createCache">
            <code>createCache</code>
          </Link>
        </li>
        <li>
          <Link to="/examples/createStreamingCache">
            <code>createStreamingCache</code>
          </Link>
        </li>
      </ul>
      <h3>Hooks</h3>
      <ul>
        <li>
          <Link to="/examples/useCacheStatus">
            <code>useCacheStatus</code>
          </Link>
        </li>
        <li>
          <Link to="/examples/useStreamingCache">
            <code>useStreamingCache</code>
          </Link>
        </li>
      </ul>
      <h3>Utilities</h3>
      <p>
        These utilities are lower level and probably not needed for most
        scenarios.
      </p>
      <ul>
        <li>
          <Link to="/examples/createInfallibleCache">
            <code>createInfallibleCache</code>
          </Link>
        </li>
        <li>
          <Link to="/examples/createWakeable">
            <code>createWakeable</code>
          </Link>
        </li>
        <li>
          <Link to="/examples/isThennable">
            <code>isThennable</code>
          </Link>
        </li>
        <li>
          <Link to="/examples/parallelize">
            <code>parallelize</code>
          </Link>
        </li>
      </ul>
    </Container>
  );
}
