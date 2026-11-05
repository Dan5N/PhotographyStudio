import { useTheme } from "next-themes";
import React, { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function ThemeChanger() {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return null;
  }
  return (
    <div className="mr-4 flex items-center">
      {theme === "dark" ? (
        <span
          className="iconfont icon-rijianmoshixhdpi cursor-pointer text-xl dark:text-white"
          onClick={() => setTheme("light")}
        />
      ) : (
        <span
          className="iconfont icon-yueduye-yejianmoshi cursor-pointer text-xl dark:text-white"
          onClick={() => setTheme("dark")}
        />
      )}
    </div>
  );
}

export default ThemeChanger;
