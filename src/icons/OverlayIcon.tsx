export default function OverlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      {...props}
    >
      <g transform="matrix(9.375 0 0 9.375 0 0)">
        <path d="M28,8h-4v-4c-.001267-1.104044-.895956-1.998733-2-2L4,2c-1.104044.001267-1.998733.895956-2,2v18c.001267,1.104044.895956,1.998733,2,2h4v4c.001267,1.104044.895956,1.998733,2,2h18c1.104044-.001267,1.998733-.895956,2-2v-18c-.001267-1.104044-.895956-1.998733-2-2ZM4,22L4,4h18v4h-12c-1.104044.001267-1.998733.895956-2,2v12h-4Zm18,0h-2.5859L10,12.586L10,10h2.5859l9.4153,9.4156L22,22ZM10,15.4141L16.5859,22L10,22v-6.5859ZM22.001,16.587L15.4141,10L22,10l.001,6.587ZM10,28v-4h12c1.104044-.001267,1.998733-.895956,2-2v-12h4v18h-18Z" />
        <rect width="32" height="32" rx="0" ry="0" fill="none" stroke="none" />
      </g>
    </svg>
  );
}
