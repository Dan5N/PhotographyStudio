import { icons, type LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { createElement } from "react";

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

const Icon = ({ name, ...props }: IconProps) => {
  const iconName = name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  const component = icons[iconName as keyof typeof icons];
  return component ? createElement(component, props) : null;
};

export default Icon;
