export default function WarningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      {...props}
    >
      <g>
        <polygon
          points="0,-126.037472 109.151653,63.018736 -109.151653,63.018736 0,-126.037472"
          transform="matrix(1.220624 0 0 1.220624 150 187.958264)"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          r="27.5"
          transform="matrix(0.545454 0 0 0.545454 150 227.85366)"
        />
        <rect
          width="48"
          height="48"
          rx="6.22"
          ry="6.22"
          transform="matrix(0.451218 0 0 2.018288 139.170768 101.561088)"
        />
      </g>
    </svg>
  );
}
