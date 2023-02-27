import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop(): null {
  const { hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Keep default behavior of restoring scroll position when user:
    // - clicked back button
    // - clicked on a link that programmatically calls `history.goBack()`
    // - manually changed the URL in the address bar (here we might want
    // to scroll to top, but we can't differentiate it from the others)
    if (navigationType === "POP") {
      return;
    }

    // In all other cases, check fragment/scroll to top
    if (hash) {
      let element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, navigationType]);

  return null;
}
