import React from 'react';

// Dynamically import all SVG files from the assets/svg directory with ?react query
const svgContext = (require as any).context('../../assets/svg?react', false, /\.svg$/);

// Create a map of SVG names to their content
const SVG_ICONS: Record<string, React.ReactElement> = {};

// Load all SVG files and create React elements
svgContext.keys().forEach((key: string) => {
  try {
    const fileName = key.replace('./', '').replace('.svg', '');
    const svgContent = svgContext(key);

    // Create a React element from the SVG content
    SVG_ICONS[fileName] = React.createElement('div', {
      dangerouslySetInnerHTML: { __html: svgContent }
    });
  } catch (error) {
    console.warn(`Failed to load SVG: ${key}`, error);
  }
});

export type SvgIconName = keyof typeof SVG_ICONS;

interface SvgIconProps {
  name: SvgIconName;
}

export const SvgIcon: React.FC<SvgIconProps> = ({
  name
}) => {
  const icon = SVG_ICONS[name];

  if (!icon) {
    console.warn(`SvgIcon: Icon "${name}" not found`);
    return null;
  }

  return icon;
};