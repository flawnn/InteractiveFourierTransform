// @ts-nocheck
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./Interactive.css";

// dynamically load (from same directory as page) and embed a react applet
export default function Interactive({
  fromCurrentDirectory = true,
  children = (Component) => <Component />,
  aspectRatio = 16 / 9,
  allowFullscreen = false,
}) {
  document.body.style.height = "100%";
  document.body.style.width = "100%";
  const forceUpdate = useForceUpdate();
  // store dynamically loaded component in ref because react doesn't like a
  // component being stored with useState
  const ref = useRef();

  // dynamically load component from provided filename
  useEffect(() => {
    import(`./advanced_interactive/index`)
      .then((module) => (ref.current = module))
      .then(forceUpdate)
      .catch((err) => {
        console.error(err);
      });
  }, [fromCurrentDirectory, forceUpdate]);

  /*
    When creating an interactive, we don't want authors to have to
    worry too much about sizing. But in every location where the interactive
    is used, it should look good. So we allow specifying the desired aspect ratio
    as a prop, and then <Interactive> will scale the component being rendered
    to always fit the container.

    The rescaling algorithm is to set the container to full-width with the
    specified aspect ratio, and then to position the children in the center
    with full width. If that means the contents are too tall, they get
    scaled down until the height is correct.
  */
  const [interactive, setInteractive] = useState(null);
  const [sizer, setSizer] = useState(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!(interactive && sizer)) return;

    const resize = () => {
      const outerBox = interactive.getBoundingClientRect();
      const innerBox = sizer.getBoundingClientRect();

      const newScale = Math.min(
        outerBox.height / innerBox.height,
        outerBox.width / innerBox.width
      );
      setScale(newScale);
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(interactive);
    resizeObserver.observe(sizer);

    return () => {
      resizeObserver.disconnect();
    };
  }, [interactive, sizer]);

  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [fullscreen]);

  if (aspectRatio === null) {
    if (sizer) {
      const box = sizer.getBoundingClientRect();
      aspectRatio = box.width / box.height;
    }
  }

  // if no component, don't render
  if (!ref.current) return null;

  const { default: defaultExport, ...otherExports } = ref.current;

  return (
    <div className="interactiveWrapper">
      <div
        className="interactive"
        ref={setInteractive}
        style={{
          paddingTop: fullscreen ? undefined : `${(1 / aspectRatio) * 100}%`,
        }}
        data-fullscreen={fullscreen}
      >
        <div className="sizer" ref={setSizer}>
          <div style={{ transform: `scale(${scale})` }}>
            {children(defaultExport, otherExports)}
          </div>
        </div>

        {allowFullscreen && (
          <button
            className="fullscreenButton"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? (
              <i className="fas fa-compress-alt" />
            ) : (
              <i className="fas fa-expand-alt" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export const useForceUpdate = () => {
  const [, setValue] = useState(0);
  return useCallback(() => setValue((value) => value + 1), []);
};
