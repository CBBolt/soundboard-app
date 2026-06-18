export default function RadialIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      {...props}
    >
      <g transform="translate(0 0.000001)">
        <ellipse rx="65.8646" ry="65.8646" transform="translate(150 150)" />
        <ellipse
          rx="65.8646"
          ry="65.8646"
          transform="matrix(0.283379 0 0 0.283379 150 39.070147)"
        />
        <g transform="matrix(0 -1 1 0 -2.718855 300.000003)">
          <ellipse
            rx="65.8646"
            ry="65.8646"
            transform="matrix(0.283379 0 0 0.283379 150 39.070147)"
          />
          <ellipse
            rx="65.8646"
            ry="65.8646"
            transform="matrix(0.283379 0 0 0.283379 150 266.367591)"
          />
        </g>
        <g transform="matrix(-0.707107 -0.707107 0.707107 -0.707107 148.077481 364.054557)">
          <ellipse
            rx="65.8646"
            ry="65.8646"
            transform="matrix(0.283379 0 0 0.283379 150 39.070147)"
          />
          <ellipse
            rx="65.8646"
            ry="65.8646"
            transform="matrix(0.283379 0 0 0.283379 150 266.367591)"
          />
        </g>
        <g transform="matrix(-0.707107 0.707107 -0.707107 -0.707107 364.054558 151.92252)">
          <ellipse
            rx="65.8646"
            ry="65.8646"
            transform="matrix(0.283379 0 0 0.283379 150 39.070147)"
          />
          <ellipse
            rx="65.8646"
            ry="65.8646"
            transform="matrix(0.283379 0 0 0.283379 150 266.367591)"
          />
        </g>
        <ellipse
          rx="65.8646"
          ry="65.8646"
          transform="matrix(0.283379 0 0 0.283379 150 266.367591)"
        />
      </g>
    </svg>
  );
}
