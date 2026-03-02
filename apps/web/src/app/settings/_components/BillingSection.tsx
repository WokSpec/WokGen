export default function BillingSection() {
  return (
    <section className="bill-sec">
      <h2 className="bill-sec__title">Billing</h2>
      <p className="bill-sec__desc">
        WokGen is free to use — no subscription required. For enterprise needs (dedicated
        infrastructure, SSO, white-label, custom models), contact us directly.
      </p>
      <a
        href="https://wokspec.org/consult"
        target="_blank"
        rel="noopener noreferrer"
        className="bill-sec__link"
      >
        Enterprise enquiry →
      </a>
    </section>
  );
}
