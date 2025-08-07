import React from 'react';

// Dynamically import all SVGs as React components
const svgContext = (require as any).context('../../assets/svg?react', false, /\.svg$/);

const SVG_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {};

svgContext.keys().forEach((key: string) => {
  const fileName = key.replace('./', '').replace('.svg', '');
  SVG_ICONS[fileName] = svgContext(key).default;
});

export type SvgIconName = keyof typeof SVG_ICONS;

interface SvgIconProps {
  name: SvgIconName;
  className?: string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ name, className }) => {
  const IconComponent = SVG_ICONS[name];

  if (!IconComponent) {
    console.warn(`SvgIcon: Icon "${name}" not found`);
    console.log('Available icons:', Object.keys(SVG_ICONS));
    return null;
  }

  // Render the actual SVG element, not a wrapper div
  return <IconComponent className={className} />;
};
