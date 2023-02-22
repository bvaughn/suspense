import { Link } from "react-router-dom";
import Container from "../../components/Container";
import styles from "./styles.module.css";

export default function HomeRoute() {
  return (
    <Container className={styles.Container}>
      <h1>suspense</h1>
      APIs for data loading and caching that can be used with the{" "}
      <strong>experimental pre-release</strong> version of React Suspense.
      <h2>Caches</h2>
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
      <h2>Hooks</h2>
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
      <h2>Utilities</h2>
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
          <Link to="/examples/suspendInParallel">
            <code>suspendInParallel</code>
          </Link>
        </li>
      </ul>
    </Container>
  );
}
