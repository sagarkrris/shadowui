export default function BrandWatermark({ publicPage = false }) {
  return <div aria-hidden="true" className="brand-watermark" data-public={publicPage ? 'true' : undefined}>InterviewIQ</div>;
}
