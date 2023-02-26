import {
  createContext,
  Suspense,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createCache, useCacheStatus } from "suspense";
import Loader from "../../../components/Loader";
import { UserStatusBadge } from "./UserStatusBadge";
import users from "./data.json";

import styles from "./style.module.css";

type User = typeof users[0];

export const userProfileCache = createCache<[number], User>(
  async (id: number) => {
    return new Promise((resolve, reject) => {
      const delay = 1_000 + Math.random() * 4_000;
      setTimeout(() => {
        const user = users.find((user) => user.id === id);
        if (user) {
          resolve(user);
        } else {
          reject(`User not found: ${id}`);
        }
      }, delay);
    });
  }
);

export const SelectedUserContext = createContext<{
  selectedUserId: number;
  setSelectedUserId: (username: number) => void;
}>(null as any);

export default function Demo() {
  return (
    <Suspense fallback={<Loader />}>
      <DemoSuspends />
    </Suspense>
  );
}

function DemoSuspends() {
  useEffect(() => {
    return () => {
      users.map(({ id }) => userProfileCache.evict(id));
    };
  }, []);

  const [selectedUserId, setSelectedUserId] = useState<number>(users[0].id);
  const context = useMemo(
    () => ({ selectedUserId, setSelectedUserId }),
    [selectedUserId]
  );

  const [state, setState] = useState<"ready" | "running" | "complete">("ready");

  const handleClick = async () => {
    switch (state) {
      case "ready":
        setState("running");
        await Promise.all(
          users.map(({ id }) => userProfileCache.fetchAsync(id))
        );
        setState("complete");
        break;
      case "complete":
        users.map(({ id }) => userProfileCache.evict(id));
        setState("ready");
        break;
    }
  };

  return (
    <SelectedUserContext.Provider value={context}>
      <div className={styles.ButtonRow}>
        <button
          className={styles.MainButton}
          disabled={state !== "ready"}
          onClick={handleClick}
        >
          Start demo
        </button>
        <button
          className={styles.MainButton}
          disabled={state !== "complete"}
          onClick={handleClick}
        >
          Reset demo
        </button>
      </div>

      <section className={styles.App}>
        <nav className={styles.SideNav}>
          {users.map((user) => (
            <UserLink key={user.id} id={user.id} name={user.name} />
          ))}
        </nav>
        <main className={styles.Main}>
          <Suspense>
            <UserProfile id={selectedUserId} />
          </Suspense>
        </main>
      </section>
    </SelectedUserContext.Provider>
  );
}

function UserProfile({ id }: { id: number }) {
  const deferredId = useDeferredValue(id);
  const userProfile = userProfileCache.fetchSuspense(deferredId);

  return (
    <>
      <h3 className={styles.Header}>{userProfile.name}</h3>
      <ul>
        <li>
          <label>Address</label>: {userProfile.address.street},{" "}
          {userProfile.address.city}, {userProfile.address.zipcode}
        </li>
        <li>
          <label>Phone</label>: {userProfile.phone}
        </li>
        <li>
          <label>Email</label>: {userProfile.email}
        </li>
        <li>
          <label>Website</label>: {userProfile.website}
        </li>
      </ul>
    </>
  );
}

function UserLink({ id, name }: { id: number; name: string }) {
  const { selectedUserId, setSelectedUserId } = useContext(SelectedUserContext);

  const isCurrent = id === selectedUserId;

  const status = useCacheStatus(userProfileCache, id);

  const handleClick = () => {
    setSelectedUserId(id);
  };

  return (
    <button
      className={styles.UserButton}
      data-current={isCurrent || undefined}
      data-status={status}
      onClick={handleClick}
    >
      <UserStatusBadge id={id} /> {name}
    </button>
  );
}
